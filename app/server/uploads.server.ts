import {
  FormDataParseError,
  MaxFileSizeExceededError,
  MaxFilesExceededError,
  MaxPartsExceededError,
  MaxTotalSizeExceededError,
  MultipartParseError,
  parseFormData,
} from "@remix-run/form-data-parser";

const MB = 1024 * 1024;

/**
 * Lee un formulario multipart con límites estrictos de tamaño y número de archivos,
 * para que un envío malicioso no pueda agotar la memoria del servidor.
 */
export async function parseMultipartForm(request: Request, limits: { maxFileSizeMb: number; maxFiles: number }) {
  const maxFileSize = limits.maxFileSizeMb * MB;
  try {
    const formData = await parseFormData(
      request,
      {
        maxFileSize,
        maxFiles: limits.maxFiles,
        maxParts: 100,
        maxTotalSize: maxFileSize * limits.maxFiles + MB,
      },
      (file) => file,
    );
    return { formData, error: null } as const;
  } catch (error) {
    if (error instanceof MaxFileSizeExceededError) {
      return { formData: null, error: `Cada archivo puede pesar como máximo ${limits.maxFileSizeMb} MB.` } as const;
    }
    if (error instanceof MaxFilesExceededError) {
      return { formData: null, error: `Puedes adjuntar como máximo ${limits.maxFiles} archivo(s).` } as const;
    }
    if (error instanceof MaxTotalSizeExceededError || error instanceof MaxPartsExceededError) {
      return { formData: null, error: "El envío es demasiado grande." } as const;
    }
    if (error instanceof FormDataParseError || error instanceof MultipartParseError) {
      return { formData: null, error: "No se pudo leer el formulario. Intenta de nuevo." } as const;
    }
    throw error;
  }
}

/** Archivos reales de un campo (ignora los campos de archivo vacíos). */
export function getFiles(formData: FormData, name: string): File[] {
  return formData
    .getAll(name)
    .filter((value): value is File => value instanceof File && value.size > 0 && value.name !== "");
}

/** Lee un formulario sin archivos con un límite de tamaño (para formularios públicos). */
export async function parseSmallForm(request: Request, maxKb = 64) {
  try {
    const formData = await parseFormData(request, { maxFiles: 0, maxParts: 50, maxTotalSize: maxKb * 1024 });
    return { formData, error: null } as const;
  } catch (error) {
    if (error instanceof FormDataParseError || error instanceof MultipartParseError) {
      return { formData: null, error: "El envío no es válido o es demasiado grande." } as const;
    }
    throw error;
  }
}

/** Los bots suelen llenar el campo oculto "website". */
export function isLikelyBot(formData: FormData) {
  const trap = formData.get("website");
  return typeof trap === "string" && trap.trim() !== "";
}
