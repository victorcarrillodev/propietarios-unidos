# Propietarios Unidos · Bosque La Primavera

Sitio web y panel de administración de la **Asociación de Propietarios Unidos en Mejoras del Bosque La Primavera** (Tala, Jalisco).

- **Sitio público:** quiénes somos, el bosque, qué hacemos (con bitácora pública), noticias, eventos, transparencia, reportes ciudadanos con fotos, solicitud de ingreso, contacto y aviso de privacidad.
- **Panel de administración (`/admin`):** miembros y predios, pagos con recibo imprimible, cuotas, adeudos, gastos, bitácora de actividades, documentos, bandeja (reportes, solicitudes y mensajes), noticias, eventos, usuarios con roles, configuración del sitio y auditoría.

## Tecnologías

| Parte | Herramienta |
| --- | --- |
| Framework | [React Router 8](https://reactrouter.com) en modo framework (la evolución oficial de **Remix**: mismos loaders, actions y formularios) con renderizado en servidor |
| Base de datos | PostgreSQL 18 + [Drizzle ORM](https://orm.drizzle.team) (migraciones SQL versionadas) |
| Estilos | Tailwind CSS 4, fuentes Inter y Fraunces servidas desde el propio sitio |
| Validación | Zod 4 |
| Seguridad | Contraseñas con Argon2id, sesiones en base de datos, cookies firmadas `httpOnly`, control de permisos por rol |
| Imágenes | Sharp (redimensiona, convierte a WebP y elimina metadatos GPS) |
| Pruebas | Vitest |

> **¿Por qué React Router y no el paquete `remix`?** El equipo de Remix unió Remix v2 con React Router: desde 2024 los proyectos nuevos de "Remix" se crean con React Router en modo framework. El paquete `remix` 2.x solo recibe mantenimiento.

## Requisitos

- Node.js **22.22 o superior** (probado con Node 26).
- Docker (para PostgreSQL). Si tu usuario no puede usar Docker sin `sudo`, agrégalo al grupo y **cierra sesión y vuelve a entrar**:
  ```bash
  sudo usermod -aG docker $USER
  ```
  `docker compose` es opcional: el script `npm run db:up` usa `docker run` si no está instalado.

## Puesta en marcha

```bash
npm install
cp .env.example .env          # y completa SESSION_SECRET y ADMIN_EMAIL
npm run setup                 # levanta PostgreSQL, aplica migraciones y crea el administrador
npm run db:seed:demo          # (opcional) datos ficticios para explorar el panel
npm run dev
```

- Sitio: <http://localhost:5173>
- Panel: <http://localhost:5173/admin> — entra con `ADMIN_EMAIL` y `ADMIN_PASSWORD` de tu `.env` (si dejaste la contraseña vacía, `npm run db:seed` genera una y la muestra en la consola).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` / `npm start` | Compilación y servidor de producción (puerto 3000) |
| `npm run typecheck` | Verificación de tipos |
| `npm test` | Pruebas unitarias |
| `npm run db:up` / `db:down` | Inicia o detiene PostgreSQL en Docker |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:generate` | Genera una migración después de cambiar `app/db/schema.ts` |
| `npm run db:seed` | Crea el administrador inicial y la configuración (`--email`, `--password`, `--reset-password`) |
| `npm run db:seed:demo` | Carga datos de demostración (**no usar en producción**) |
| `npm run db:studio` | Explorador visual de la base de datos |

## Roles del panel

| Rol | Acceso |
| --- | --- |
| Administración general | Todo, incluidos usuarios, configuración y auditoría |
| Tesorería | Miembros, pagos, cuotas, adeudos, gastos, documentos y bitácora |
| Secretaría | Miembros, bitácora, documentos, bandeja y contenido del sitio |
| Comunicación | Bitácora, bandeja y contenido del sitio |

Siempre debe existir al menos un administrador activo; nadie puede quitarse su propio rol ni desactivarse.

## Estructura

```
app/
├── routes/site/        Páginas públicas
├── routes/admin/       Panel (cada módulo en su carpeta)
├── routes/resources/   Imágenes, descargas, sitemap, robots, healthz
├── components/         Interfaz (ui/, site/, admin/)
├── db/schema.ts        Esquema de la base de datos
├── lib/                Lógica compartida: formatos, validaciones, permisos, textos
└── server/             Solo servidor: base de datos, sesiones, archivos, límites de envío
drizzle/                Migraciones SQL
scripts/                Migrar, sembrar datos, Docker, íconos
storage/                Archivos subidos (no se versiona)
```

## Personalización

- **Textos, contacto, mesa directiva y datos para donativos:** Panel → Configuración (no requiere programar).
- **Logotipo:** el emblema actual es provisional. Reemplaza `public/favicon.svg` y el componente `LogoMark` de `app/components/brand.tsx`; luego regenera íconos con `npx tsx scripts/generate-icons.ts`.
- **Colores:** variables `--color-forest-*` y `--color-earth-*` en `app/app.css`.
- **Contenido de “El bosque” y “Qué hacemos”:** `app/routes/site/forest.tsx` y `app/components/site/programs.ts`.
- **Aviso de privacidad:** `app/routes/site/privacy.tsx`. Es un texto base: revísalo con un asesor legal antes de publicar.

## Producción

1. Variables obligatorias: `DATABASE_URL`, `SESSION_SECRET` (48+ caracteres aleatorios) y `SITE_URL` con `https://` (activa cookies seguras, enlaces para redes y sitemap).
2. Con Docker Compose (app + base de datos):
   ```bash
   docker compose --profile produccion up -d --build
   docker compose exec app npm run db:seed
   ```
   El contenedor aplica las migraciones al arrancar y expone `/healthz`.
3. Sin Docker: `npm ci && npm run build && npm run db:migrate && npm start`.
4. Colócalo detrás de un proxy con HTTPS (Caddy, Nginx) y pon `TRUST_PROXY=true`. Si el proxy cambia el dominio, agrega tus dominios en `allowedActionOrigins` de `react-router.config.ts`.
5. **Respaldos:** la base de datos (`pg_dump`) **y** la carpeta `storage/` (documentos y fotos).
6. Antes de publicar, elimina los datos de demostración si los cargaste.

## Seguridad incluida

- Contraseñas Argon2id; sesiones revocables (se cierran al desactivar un usuario o cambiar la contraseña).
- Límite de intentos de inicio de sesión y de envíos en formularios públicos, más campo trampa contra bots.
- Protección CSRF de React Router, encabezados de seguridad y validación de todos los datos con Zod.
- Archivos validados por su contenido real (no solo por la extensión), guardados fuera de `public/` y servidos con control de permisos.
- Bitácora de auditoría de las acciones del panel.
- Los pagos no se borran: se cancelan con motivo.
