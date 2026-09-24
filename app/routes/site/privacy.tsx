import { Container, PageHero } from "~/components/site/sections";
import { seo, siteUrlFrom } from "~/lib/seo";
import { getSiteSettings } from "~/server/settings.server";
import type { Route } from "./+types/privacy";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Aviso de privacidad",
    description: "Cómo tratamos y protegemos los datos personales que compartes con la asociación.",
    path: "/aviso-de-privacidad",
    siteUrl: siteUrlFrom(matches),
  });

export async function loader() {
  const s = await getSiteSettings();
  return { orgName: s.orgName, address: s.address, email: s.email };
}

// Texto base. Recomendamos revisarlo con un asesor legal antes de publicar el sitio.
export default function Privacy({ loaderData }: Route.ComponentProps) {
  const { orgName, address, email } = loaderData;
  return (
    <>
      <PageHero eyebrow="Legal" title="Aviso de privacidad" />
      <Container className="max-w-3xl py-12 sm:py-16">
        <div className="prose-content">
          <p>
            <strong>{orgName}</strong>
            {address && <>, con domicilio en {address},</>} es responsable del tratamiento de los datos personales
            que nos proporcionas a través de este sitio web, conforme a la legislación mexicana aplicable en materia de
            protección de datos personales en posesión de particulares.
          </p>

          <h2>Datos que recabamos</h2>
          <ul>
            <li>Datos de identificación y contacto: nombre, correo electrónico y teléfono.</li>
            <li>Datos relacionados con predios: nombre, ubicación aproximada y superficie.</li>
            <li>Contenido de mensajes, reportes y las fotografías que decidas adjuntar.</li>
          </ul>
          <p>No solicitamos datos personales sensibles.</p>

          <h2>Para qué usamos tus datos</h2>
          <ul>
            <li>Atender tus mensajes, comentarios y solicitudes de ingreso a la asociación.</li>
            <li>Dar seguimiento a los reportes de incidencias en el bosque y, cuando corresponda, canalizarlos a las autoridades competentes.</li>
            <li>Llevar el registro de integrantes y de sus aportaciones.</li>
          </ul>
          <p>
            Los reportes pueden enviarse de forma anónima. Las fotografías se procesan para eliminar sus metadatos,
            incluida la ubicación GPS.
          </p>

          <h2>Transferencias</h2>
          <p>
            No vendemos tus datos personales. Los compartimos con terceros solo cuando sea necesario para atender un
            reporte ante autoridades, cuando la ley lo requiera, o con los siguientes proveedores que nos ayudan a
            operar el sitio público (no se activan dentro del panel de administración):
          </p>
          <ul>
            <li>
              <strong>Google Analytics</strong>: mide el uso del sitio (páginas vistas, dispositivo, ubicación
              aproximada).{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Política de privacidad de Google
              </a>
              .
            </li>
            <li>
              <strong>Contentsquare</strong> (antes Hotjar): analiza cómo navegas el sitio (mapas de calor y
              grabaciones de sesión anonimizadas) para ayudarnos a mejorarlo.{" "}
              <a href="https://contentsquare.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
                Política de privacidad de Contentsquare
              </a>
              .
            </li>
          </ul>

          <h2>Tus derechos (ARCO)</h2>
          <p>
            Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos, así como
            revocar tu consentimiento
            {email ? (
              <>
                , escribiendo a <a href={`mailto:${email}`}>{email}</a>
              </>
            ) : (
              " contactándonos por los medios publicados en este sitio"
            )}
            . Responderemos tu solicitud en los plazos que marca la ley.
          </p>

          <h2>Cambios a este aviso</h2>
          <p>Cualquier cambio a este aviso de privacidad se publicará en esta misma página.</p>
        </div>
      </Container>
    </>
  );
}
