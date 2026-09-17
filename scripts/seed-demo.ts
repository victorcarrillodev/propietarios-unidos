// Datos de DEMOSTRACIÓN para probar el sitio y el panel. No lo uses en producción.
// Uso: npm run db:seed:demo   (agrega --force si ya hay miembros registrados)
import { count, eq } from "drizzle-orm";
import { parseArgs } from "node:util";
import {
  activityRecords,
  citizenReports,
  contactMessages,
  events,
  expenses,
  fees,
  members,
  membershipRequests,
  payments,
  posts,
  properties,
  users,
} from "~/db/schema";
import type { ExpenseCategory, MemberType, PaymentMethod, RecordType } from "~/lib/enums";
import { currentYear, localInputToDate, todayISO } from "~/lib/format";
import { closeDb, db } from "~/server/db.server";

const { values: args } = parseArgs({ options: { force: { type: "boolean", default: false } } });

// Generador pseudoaleatorio con semilla: los datos salen iguales en cada ejecución.
let seed = 20260916;
function random() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!;
const between = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;

function shiftDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const FIRST_NAMES = [
  "José", "María", "Juan", "Guadalupe", "Francisco", "Rosa", "Antonio", "Carmen", "Jesús", "Teresa",
  "Miguel", "Leticia", "Pedro", "Alejandra", "Ramón", "Patricia", "Arturo", "Silvia", "Javier", "Martha",
  "Raúl", "Verónica", "Salvador", "Elena", "Ignacio", "Lucía", "Rafael", "Adriana", "Héctor", "Gabriela",
];
const LAST_NAMES = [
  "González", "Hernández", "García", "Martínez", "López", "Rodríguez", "Pérez", "Sánchez", "Ramírez", "Flores",
  "Gómez", "Díaz", "Reyes", "Cruz", "Morales", "Ortiz", "Gutiérrez", "Chávez", "Ruiz", "Aguilar",
  "Navarro", "Robles", "Orozco", "Íñiguez", "Villaseñor", "Camarena", "Plascencia", "Ceja",
];
const LOCALITIES = ["El Chorro", "Las Tinajas", "Llano Grande", "La Cuchilla", "Arroyo Hondo", "Las Palomas", "Cerro Alto", "El Pedregal"];
const MUNICIPALITIES = ["Tala", "Tala", "Tala", "Zapopan", "Tlajomulco de Zúñiga", "El Arenal"];
const METHODS: PaymentMethod[] = ["efectivo", "efectivo", "transferencia", "transferencia", "deposito"];

async function main() {
  const [{ total }] = await db.select({ total: count() }).from(members);
  if (total > 0 && !args.force) {
    throw new Error("Ya hay miembros registrados. Usa --force si de verdad quieres agregar datos de demostración.");
  }
  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
  if (!admin) throw new Error("Primero crea el administrador con: npm run db:seed");

  const today = todayISO();
  const year = currentYear();

  // Cuotas
  const [annualFee, roadFee] = await db
    .insert(fees)
    .values([
      { name: "Cuota anual", description: "Cuota ordinaria de cada miembro", amountCents: 120000, frequency: "anual" },
      { name: "Aportación mejora de caminos", description: "Aportación única para rehabilitar caminos de acceso", amountCents: 50000, frequency: "unica" },
    ])
    .returning({ id: fees.id, amountCents: fees.amountCents });

  // Miembros y predios
  const memberRows = Array.from({ length: 36 }, (_, i) => {
    const first = pick(FIRST_NAMES);
    const last = `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
    const type: MemberType = i % 7 === 0 ? "ejidatario" : i % 11 === 0 ? "colaborador" : "propietario";
    const status = i % 12 === 5 ? ("pendiente" as const) : i % 13 === 7 ? ("inactivo" as const) : ("activo" as const);
    return {
      fullName: `${first} ${last}`,
      memberType: type,
      status,
      phone: `33 ${between(1000, 3999)} ${between(1000, 9999)}`,
      email: random() > 0.35 ? `${first}.${last.split(" ")[0]}${i}@ejemplo.mx`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : null,
      address: random() > 0.5 ? `Calle ${pick(["Hidalgo", "Morelos", "Juárez", "Allende", "Zaragoza"])} ${between(10, 400)}, Tala, Jal.` : null,
      joinedOn: shiftDays(today, -between(30, 1100)),
    };
  });
  const createdMembers = await db.insert(members).values(memberRows).returning({ id: members.id, status: members.status, memberType: members.memberType });

  await db.insert(properties).values(
    createdMembers.flatMap((member, i) =>
      Array.from({ length: i % 5 === 0 ? 2 : member.memberType === "colaborador" ? 0 : 1 }, (_, n) => ({
        memberId: member.id,
        name: `Predio ${pick(["Los Pinos", "El Encino", "La Loma", "Ojo de Agua", "El Roble", "Las Ánimas"])}${n > 0 ? " II" : ""}`,
        municipality: pick(MUNICIPALITIES),
        locality: pick(LOCALITIES),
        tenure: member.memberType === "ejidatario" ? ("ejidal" as const) : ("privada" as const),
        areaHa: (between(5, 400) / 10).toFixed(2),
      })),
    ),
  );

  // Pagos: cuota del año pasado y del actual (no todos al corriente) + aportaciones y donativos.
  const active = createdMembers.filter((m) => m.status === "activo");
  const paymentRows: (typeof payments.$inferInsert)[] = [];
  for (const member of active) {
    if (random() < 0.8) {
      paymentRows.push({
        memberId: member.id, feeId: annualFee!.id, concept: "cuota", period: String(year - 1), amountCents: annualFee!.amountCents,
        paidOn: `${year - 1}-${String(between(1, 11)).padStart(2, "0")}-${String(between(1, 27)).padStart(2, "0")}`,
        method: pick(METHODS), recordedBy: admin.id,
      });
    }
    const roll = random();
    if (roll < 0.55) {
      paymentRows.push({
        memberId: member.id, feeId: annualFee!.id, concept: "cuota", period: String(year), amountCents: annualFee!.amountCents,
        paidOn: shiftDays(today, -between(3, 240)), method: pick(METHODS), recordedBy: admin.id,
        reference: random() > 0.6 ? `TRF${between(100000, 999999)}` : null,
      });
    } else if (roll < 0.7) {
      paymentRows.push({
        memberId: member.id, feeId: annualFee!.id, concept: "cuota", period: String(year), amountCents: 60000,
        paidOn: shiftDays(today, -between(3, 200)), method: "efectivo", notes: "Pago parcial", recordedBy: admin.id,
      });
    }
    if (random() < 0.4) {
      paymentRows.push({
        memberId: member.id, feeId: roadFee!.id, concept: "aportacion", amountCents: roadFee!.amountCents,
        paidOn: shiftDays(today, -between(10, 300)), method: pick(METHODS), recordedBy: admin.id,
      });
    }
  }
  paymentRows.push(
    { payerName: "Grupo de ciclistas Bosque Vivo", concept: "donativo", amountCents: 350000, paidOn: shiftDays(today, -45), method: "transferencia", notes: "Donativo para herramientas", recordedBy: admin.id },
    { payerName: "Vecinos de Tala Centro", concept: "donativo", amountCents: 180000, paidOn: shiftDays(today, -120), method: "efectivo", recordedBy: admin.id },
  );
  paymentRows.sort((a, b) => a.paidOn.localeCompare(b.paidOn));
  const insertedPayments = await db.insert(payments).values(paymentRows).returning({ id: payments.id });
  await db
    .update(payments)
    .set({ status: "cancelado", cancelReason: "Registrado dos veces por error", cancelledAt: new Date(), cancelledBy: admin.id })
    .where(eq(payments.id, insertedPayments[insertedPayments.length - 3]!.id));

  // Gastos
  const expenseItems: Array<[ExpenseCategory, string, number, string | null]> = [
    ["incendios", "Renta de maquinaria para brecha cortafuego", 1850000, "Maquinaria del Valle"],
    ["incendios", "Batefuegos y rastrillos para brigada", 640000, "Ferretería La Primavera"],
    ["caminos", "Balastre para rehabilitar camino de acceso", 920000, "Materiales Tala"],
    ["caminos", "Mano de obra para cunetas y desagües", 780000, null],
    ["vigilancia", "Combustible para recorridos de vigilancia", 210000, null],
    ["vigilancia", "Radios portátiles de comunicación", 480000, "Comunicaciones GDL"],
    ["reforestacion", "Planta de pino y encino para reforestación", 360000, "Vivero forestal"],
    ["limpieza", "Costales, guantes y traslado de basura", 150000, null],
    ["administracion", "Papelería e impresión de avisos", 85000, null],
    ["legal", "Certificación de acta de asamblea", 250000, "Notaría"],
    ["eventos", "Renta de sillas y lona para asamblea", 180000, null],
  ];
  await db.insert(expenses).values(
    expenseItems.map(([category, description, amountCents, supplier], i) => ({
      category, description, amountCents, supplier,
      spentOn: shiftDays(today, -(15 + i * 28 + between(0, 10))),
      method: pick(METHODS), recordedBy: admin.id,
    })),
  );

  // Bitácora
  const recordItems: Array<[RecordType, string, string, boolean, number | null]> = [
    ["vigilancia", "Recorrido de vigilancia en caminos de acceso", "Se recorrieron 12 km de caminos. Sin incidencias; se retiraron dos fogatas abandonadas.", true, 6],
    ["brecha", "Mantenimiento de brecha cortafuego", "Limpieza de 1.8 km de brecha antes de la temporada seca.", true, 14],
    ["limpieza", "Jornada de limpieza en La Cuchilla", "Con apoyo de voluntarios se retiraron 38 costales de basura.", true, 27],
    ["reunion", "Reunión con usuarios del acceso norte", "Se acordaron horarios de acceso y reglas para ciclistas y visitantes.", true, 18],
    ["caminos", "Rehabilitación de tramo dañado por lluvias", "Se colocó balastre y se abrieron cunetas en 400 m de camino.", true, 9],
    ["reforestacion", "Reforestación en zona afectada por incendio", "Se plantaron 350 árboles de pino y encino.", true, 31],
    ["incendio", "Conato de incendio controlado", "Se detectó humo cerca de Llano Grande; se dio aviso al 911 y se controló en 40 minutos.", true, 8],
    ["asamblea", "Asamblea ordinaria de propietarios", "Se presentó el informe de tesorería y se aprobó el plan de trabajo.", false, 42],
    ["capacitacion", "Capacitación en prevención de incendios", "Taller básico para brigadistas voluntarios.", true, 22],
    ["vigilancia", "Revisión de cercas en predios colindantes", "Se detectaron dos tramos de cerca dañados; se notificó a los propietarios.", false, 4],
  ];
  await db.insert(activityRecords).values(
    recordItems.map(([type, title, description, isPublic, participants], i) => ({
      type, title, description, isPublic, participants,
      occurredOn: shiftDays(today, -(4 + i * 17)),
      location: pick(LOCALITIES),
      createdBy: admin.id,
    })),
  );

  // Noticias
  const now = Date.now();
  await db.insert(posts).values([
    {
      title: "Arranca la temporada de prevención de incendios",
      slug: "arranca-la-temporada-de-prevencion-de-incendios",
      excerpt: "Reforzamos recorridos y brechas cortafuego. Te compartimos cómo ayudar a prevenir incendios en el bosque.",
      body: "Con la llegada de la temporada seca, **aumenta el riesgo de incendios** en el Bosque La Primavera.\n\n## ¿Qué estamos haciendo?\n\n- Mantenimiento de brechas cortafuego en predios.\n- Recorridos de vigilancia los fines de semana.\n- Coordinación con brigadas y autoridades.\n\n## ¿Cómo puedes ayudar?\n\nNo enciendas fogatas, llévate tu basura y, si ves humo, **llama de inmediato al 911**. También puedes [enviarnos un reporte](/reportar).",
      published: true, publishedAt: new Date(now - 6 * 86400000), authorId: admin.id,
    },
    {
      title: "Acuerdos con usuarios del acceso norte",
      slug: "acuerdos-con-usuarios-del-acceso-norte",
      excerpt: "Propietarios y visitantes acordamos horarios y reglas para un uso responsable de los caminos.",
      body: "Gracias a todas las personas que asistieron a la reunión. Estos son los principales acuerdos:\n\n1. Horario de acceso de 7:00 a 18:00 h.\n2. Respetar los caminos señalados.\n3. No ingresar con vehículos a motor fuera de los caminos principales.\n\nSeguiremos abriendo espacios de diálogo entre usuarios y propietarios.",
      published: true, publishedAt: new Date(now - 20 * 86400000), authorId: admin.id,
    },
    {
      title: "Jornada de reforestación: ¡gracias por participar!",
      slug: "jornada-de-reforestacion-gracias-por-participar",
      excerpt: "Plantamos 350 árboles nativos en una zona afectada por incendios.",
      body: "La jornada reunió a propietarios, familias y voluntarios. Plantamos **350 árboles** de pino y encino que cuidaremos durante los próximos años.",
      published: true, publishedAt: new Date(now - 60 * 86400000), authorId: admin.id,
    },
    {
      title: "Borrador: informe anual de actividades",
      slug: "informe-anual-de-actividades",
      excerpt: null,
      body: "Borrador del informe anual. Pendiente de revisión por la mesa directiva.",
      published: false, publishedAt: null, authorId: admin.id,
    },
  ]);

  // Eventos (horario del centro de México)
  const at = (days: number, time: string) => localInputToDate(`${shiftDays(today, days)}T${time}`)!;
  await db.insert(events).values([
    { title: "Jornada de limpieza en caminos de acceso", description: "Punto de reunión en la entrada principal. Trae gorra, agua y guantes.", location: "Acceso La Cuchilla", startsAt: at(9, "08:00"), endsAt: at(9, "13:00"), published: true, createdBy: admin.id },
    { title: "Asamblea informativa de propietarios", description: "Informe de actividades y de tesorería.", location: "Tala Centro", startsAt: at(23, "17:00"), endsAt: at(23, "19:00"), published: true, createdBy: admin.id },
    { title: "Taller de prevención de incendios", description: "Capacitación abierta para vecinos y voluntarios.", location: "Tala, Jalisco", startsAt: at(37, "10:00"), endsAt: at(37, "13:00"), published: true, createdBy: admin.id },
    { title: "Reunión de mesa directiva", description: "Reunión interna.", location: "Oficina de la asociación", startsAt: at(5, "18:00"), endsAt: null, published: false, createdBy: admin.id },
    { title: "Reforestación comunitaria", description: "Gracias a todas las personas que participaron.", location: "Llano Grande", startsAt: at(-60, "08:00"), endsAt: at(-60, "12:00"), published: true, createdBy: admin.id },
  ]);

  // Bandeja
  await db.insert(contactMessages).values([
    { name: "Laura Méndez", email: "laura.mendez@ejemplo.mx", phone: "33 2211 4455", subject: "Horarios de acceso", message: "Hola, ¿cuál es el horario para entrar en bicicleta por el acceso norte? Gracias." },
    { name: "Carlos Ibarra", email: "carlos.ibarra@ejemplo.mx", subject: "Voluntariado", message: "Me gustaría participar como voluntario en las jornadas de limpieza.", status: "leido" },
  ]);
  await db.insert(membershipRequests).values([
    { fullName: "Andrés Villalobos Ruiz", email: "andres.villalobos@ejemplo.mx", phone: "33 1987 6543", memberType: "propietario", propertyName: "Predio La Mesa", municipality: "Tala", locality: "Las Palomas", areaHa: "12.50", message: "Tengo un predio colindante con el bosque y quiero sumarme." },
    { fullName: "Sofía Carrillo", email: "sofia.carrillo@ejemplo.mx", phone: "33 3456 7788", memberType: "colaborador", message: "Soy bióloga y me interesa apoyar en educación ambiental." },
  ]);
  await db.insert(citizenReports).values([
    { type: "basura", location: "Camino a Las Tinajas, a 1 km de la entrada", occurredOn: shiftDays(today, -2), description: "Hay un tiradero de escombro y bolsas de basura a un lado del camino.", reporterName: "Vecino de Tala", reporterPhone: "33 1122 3344" },
    { type: "tala", location: "Paraje El Chorro", occurredOn: shiftDays(today, -5), description: "Se escucharon motosierras por la mañana y hay troncos recién cortados.", status: "en_revision", adminNotes: "Se programó recorrido de verificación." },
    { type: "incendio", location: "Llano Grande", occurredOn: shiftDays(today, -30), description: "Columna de humo visible desde la carretera.", status: "atendido", adminNotes: "Conato controlado. Registrado en bitácora." },
  ]);

  console.log(`✅ Datos de demostración creados: ${createdMembers.length} miembros, ${paymentRows.length} pagos, ${expenseItems.length} gastos, ${recordItems.length} actividades, 4 noticias, 5 eventos.`);
  console.log("⚠️  Son datos ficticios: bórralos antes de publicar el sitio.");
}

main()
  .catch((error) => {
    console.error(`❌ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
