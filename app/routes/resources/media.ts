import { fileResponse } from "~/server/storage.server";
import type { Route } from "./+types/media";

// Imágenes públicas (portadas de noticias). Los nombres son únicos, así que
// el navegador y la CDN pueden guardarlas en caché por un año.
export async function loader({ params }: Route.LoaderArgs) {
  const key = params["*"] ?? "";
  if (!/^images\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/.test(key)) {
    return new Response("No encontrado", { status: 404 });
  }
  return fileResponse(key, {
    contentType: "image/webp",
    cacheControl: "public, max-age=31536000, immutable",
  });
}
