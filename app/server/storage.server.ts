import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";
import { env } from "./env.server";

// Los archivos se guardan fuera de /public y se sirven mediante rutas que
// validan permisos. Para usar S3/R2 en el futuro basta con reimplementar este módulo.
const ROOT = path.resolve(env.STORAGE_DIR);

export type StorageFolder = "documents" | "images" | "reports";

function resolveKey(key: string) {
  const fullPath = path.resolve(ROOT, key);
  if (!fullPath.startsWith(ROOT + path.sep)) {
    throw new Error("Ruta de archivo inválida");
  }
  return fullPath;
}

export function createStorageKey(folder: StorageFolder, extension: string) {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${folder}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;
}

export async function saveFile(key: string, content: Uint8Array) {
  const fullPath = resolveKey(key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

export async function deleteFile(key: string | null | undefined) {
  if (!key) return;
  try {
    await rm(resolveKey(key), { force: true });
  } catch (error) {
    console.error(`No se pudo eliminar el archivo ${key}`, error);
  }
}

function contentDisposition(fileName: string, type: "inline" | "attachment") {
  const fallback = fileName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.\- ]/g, "_");
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** Responde con el contenido de un archivo como stream (sin cargarlo completo en memoria). */
export async function fileResponse(
  key: string,
  options: { contentType: string; fileName?: string; download?: boolean; cacheControl?: string },
) {
  let fullPath: string;
  try {
    fullPath = resolveKey(key);
    const info = await stat(fullPath);
    if (!info.isFile()) throw new Error("No es un archivo");
    const inline = !options.download && INLINE_TYPES.has(options.contentType);
    const headers = new Headers({
      "Content-Type": options.contentType,
      "Content-Length": String(info.size),
      "Cache-Control": options.cacheControl ?? "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    if (options.fileName) {
      headers.set("Content-Disposition", contentDisposition(options.fileName, inline ? "inline" : "attachment"));
    }
    const stream = Readable.toWeb(createReadStream(fullPath)) as ReadableStream<Uint8Array>;
    return new Response(stream, { headers });
  } catch {
    return new Response("Archivo no encontrado", { status: 404 });
  }
}

// ---------------------------------------------------------------------------
// Validación de tipos de archivo (por contenido, no solo por extensión)
// ---------------------------------------------------------------------------

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  doc: "application/msword",
  xls: "application/vnd.ms-excel",
  ppt: "application/vnd.ms-powerpoint",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
};

const INLINE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export const DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv";

function hasSignature(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function detectDocumentType(bytes: Uint8Array, fileName: string) {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const result = (extension: string) => ({ extension, mimeType: MIME_TYPES[extension]! });

  if (hasSignature(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return result("pdf");
  if (hasSignature(bytes, [0xff, 0xd8, 0xff])) return result("jpg");
  if (hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return result("png");
  if (hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && hasSignature(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return result("webp");
  }
  if (hasSignature(bytes, [0x50, 0x4b, 0x03, 0x04]) && ["docx", "xlsx", "pptx", "odt", "ods", "odp"].includes(ext)) {
    return result(ext);
  }
  if (hasSignature(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) && ["doc", "xls", "ppt"].includes(ext)) {
    return result(ext);
  }
  if (["txt", "csv"].includes(ext) && !bytes.subarray(0, 8192).includes(0)) return result(ext);
  return null;
}

/**
 * Optimiza una imagen: corrige orientación, limita tamaño, convierte a WebP y
 * elimina metadatos (incluida la ubicación GPS). Lanza error si no es una imagen válida.
 */
export async function optimizeImage(input: Uint8Array, maxSize = 1600) {
  const { data, info } = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

/** Guarda una imagen optimizada y devuelve su clave. */
export async function saveOptimizedImage(file: File, folder: StorageFolder, maxSize?: number) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = await optimizeImage(bytes, maxSize);
  const key = createStorageKey(folder, "webp");
  await saveFile(key, image.data);
  return key;
}
