import type { Config } from "@react-router/dev/config";

export default {
  // Renderizado en el servidor: páginas rápidas y buen SEO para el sitio público.
  ssr: true,
  allowedActionOrigins: [
    "sigil-server.sphinx-pickerel.ts.net",
    "*.ts.net",
    "localhost:*",
    "127.0.0.1:*",
    "propietariosunidos.mx",
    "*.propietariosunidos.mx",
    "propietariosunidos.com.mx",
    "*.propietariosunidos.com.mx",
    "propietariosunidosblp.com.mx",
    "*.propietariosunidosblp.com.mx",
  ],
} satisfies Config;
