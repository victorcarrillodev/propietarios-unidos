// Convierte cantidades a letra en español de México, como se usa en recibos:
// 125050 centavos → "MIL DOSCIENTOS CINCUENTA PESOS 50/100 M.N."

const UNITS = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

const HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

/** 0–999 en letra. */
function belowThousand(n: number): string {
  if (n === 100) return "cien";
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]!);
  if (rest > 0) {
    if (rest < 30) {
      parts.push(UNITS[rest]!);
    } else {
      const tens = Math.floor(rest / 10);
      const units = rest % 10;
      parts.push(units === 0 ? TENS[tens]! : `${TENS[tens]} y ${UNITS[units]}`);
    }
  }
  return parts.join(" ");
}

/** Apócope ante sustantivo masculino: "veintiuno" → "veintiún", "uno" → "un". */
function apocope(words: string) {
  if (words.endsWith("veintiuno")) return `${words.slice(0, -"veintiuno".length)}veintiún`;
  if (words.endsWith("uno")) return `${words.slice(0, -3)}un`;
  return words;
}

/** Entero no negativo (hasta 999,999,999,999) en letra. */
export function integerToWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "cero";
  if (n >= 1_000_000_000_000) throw new RangeError("Cantidad demasiado grande");

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];

  if (millions > 0) {
    parts.push(millions === 1 ? "un millón" : `${apocope(integerToWords(millions))} millones`);
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? "mil" : `${apocope(belowThousand(thousands))} mil`);
  }
  if (rest > 0) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** Centavos → "MIL DOSCIENTOS CINCUENTA PESOS 50/100 M.N." */
export function amountToWords(cents: number) {
  const pesos = Math.floor(cents / 100);
  const centavos = String(Math.round(cents % 100)).padStart(2, "0");
  let words = apocope(integerToWords(pesos));
  // "un millón de pesos", "dos millones de pesos" (millones exactos)
  if (pesos >= 1_000_000 && pesos % 1_000_000 === 0) words += " de";
  const unit = pesos === 1 ? "peso" : "pesos";
  return `${words} ${unit} ${centavos}/100 M.N.`.toUpperCase();
}
