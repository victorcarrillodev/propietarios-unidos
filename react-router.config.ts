import type { Config } from "@react-router/dev/config";

export default {
  // Renderizado en el servidor: páginas rápidas y buen SEO para el sitio público.
  ssr: true,
  // Si publicas la app detrás de un proxy que cambia el host (por ejemplo un
  // balanceador), agrega aquí tus dominios para que los formularios funcionen:
  // allowedActionOrigins: ["propietariosunidos.mx", "*.propietariosunidos.mx"],
} satisfies Config;
