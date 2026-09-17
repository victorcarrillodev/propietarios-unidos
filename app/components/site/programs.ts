import {
  Binoculars,
  Flame,
  MessagesSquare,
  Recycle,
  Route as RouteIcon,
  Sprout,
  type LucideIcon,
} from "lucide-react";

export type Program = {
  icon: LucideIcon;
  title: string;
  text: string;
  details: string[];
};

/** Líneas de trabajo de la asociación (se muestran en Inicio y en "Qué hacemos"). */
export const PROGRAMS: Program[] = [
  {
    icon: Flame,
    title: "Prevención de incendios",
    text: "Brechas cortafuego, vigilancia en temporada de estiaje y coordinación con brigadas y autoridades.",
    details: [
      "Apertura y mantenimiento de brechas cortafuego en predios.",
      "Vigilancia en los meses de mayor riesgo (temporada seca).",
      "Aviso inmediato a brigadas y autoridades ante humo o conatos.",
    ],
  },
  {
    icon: RouteIcon,
    title: "Caminos y accesos",
    text: "Mejoramos y mantenemos caminos para el paso seguro de brigadas, vecinos y visitantes.",
    details: [
      "Rehabilitación de tramos dañados por lluvias y uso intensivo.",
      "Control de erosión y escurrimientos en caminos de terracería.",
      "Señalización y acuerdos sobre el uso de accesos.",
    ],
  },
  {
    icon: Binoculars,
    title: "Vigilancia del territorio",
    text: "Recorridos para detectar tala ilegal, tiraderos, invasiones y otros daños al bosque.",
    details: [
      "Recorridos periódicos por predios y colindancias.",
      "Registro y seguimiento de incidencias.",
      "Canalización de denuncias a las autoridades competentes.",
    ],
  },
  {
    icon: Sprout,
    title: "Reforestación y suelos",
    text: "Plantamos especies nativas y protegemos el suelo y el agua en las zonas afectadas.",
    details: [
      "Reforestación con especies nativas en zonas afectadas.",
      "Obras sencillas de conservación de suelo y agua.",
      "Cuidado y seguimiento de las plantas en sus primeros años.",
    ],
  },
  {
    icon: MessagesSquare,
    title: "Diálogo con usuarios",
    text: "Escuchamos comentarios y denuncias, y promovemos reglas claras para el uso del bosque.",
    details: [
      "Canales abiertos para comentarios, dudas y denuncias.",
      "Acuerdos de convivencia entre propietarios y visitantes.",
      "Información oportuna sobre accesos, cierres y avisos.",
    ],
  },
  {
    icon: Recycle,
    title: "Limpieza del bosque",
    text: "Jornadas para retirar basura y evitar focos de contaminación y de incendio.",
    details: [
      "Jornadas de limpieza con propietarios y voluntarios.",
      "Retiro de tiraderos clandestinos.",
      "Campañas para que los visitantes se lleven su basura.",
    ],
  },
];
