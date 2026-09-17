import { describe, expect, it } from "vitest";
import {
  dateToLocalInput,
  formatDate,
  formatMoney,
  localInputToDate,
  parseMoneyToCents,
  shiftMonth,
  todayISO,
} from "./format";
import { amountToWords, integerToWords } from "./number-words";
import { can } from "./permissions";
import { parseBoard, resolveSiteSettings, DEFAULT_SITE_SETTINGS } from "./site-settings";
import { slugify, whatsappLink } from "./utils";

describe("dinero", () => {
  it("convierte pesos escritos a centavos sin errores de redondeo", () => {
    expect(parseMoneyToCents("1,250.50")).toBe(125050);
    expect(parseMoneyToCents("$1200")).toBe(120000);
    expect(parseMoneyToCents("0.1")).toBe(10);
    expect(parseMoneyToCents("19.99")).toBe(1999);
    expect(parseMoneyToCents("12.345")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("-5")).toBeNull();
  });

  it("formatea en pesos mexicanos", () => {
    expect(formatMoney(125050)).toBe("$1,250.50");
  });
});

describe("montos con letra", () => {
  it.each([
    [0, "cero"],
    [1, "uno"],
    [16, "dieciséis"],
    [21, "veintiuno"],
    [100, "cien"],
    [101, "ciento uno"],
    [1000, "mil"],
    [21000, "veintiún mil"],
    [31500, "treinta y un mil quinientos"],
    [1_000_000, "un millón"],
    [2_500_000, "dos millones quinientos mil"],
  ])("%i → %s", (value, words) => {
    expect(integerToWords(value)).toBe(words);
  });

  it("usa el formato de recibo", () => {
    expect(amountToWords(125050)).toBe("MIL DOSCIENTOS CINCUENTA PESOS 50/100 M.N.");
    expect(amountToWords(100)).toBe("UN PESO 00/100 M.N.");
    expect(amountToWords(2100)).toBe("VEINTIÚN PESOS 00/100 M.N.");
    expect(amountToWords(100_000_000)).toBe("UN MILLÓN DE PESOS 00/100 M.N.");
  });
});

describe("fechas", () => {
  it("no desplaza fechas sin hora por la zona horaria", () => {
    expect(formatDate("2026-01-01")).toContain("2026");
    expect(formatDate("2026-01-01")).toMatch(/^1 /);
  });

  it("interpreta datetime-local en horario del centro de México", () => {
    const date = localInputToDate("2026-10-05T09:00");
    expect(date?.toISOString()).toBe("2026-10-05T15:00:00.000Z");
    expect(dateToLocalInput(date)).toBe("2026-10-05T09:00");
    expect(localInputToDate("no-es-fecha")).toBeNull();
  });

  it("calcula meses y el día actual en México", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-11", 3)).toBe("2027-02");
    // 3:00 UTC del 16 de sept. todavía es 15 de sept. en México.
    expect(todayISO(new Date("2026-09-16T03:00:00Z"))).toBe("2026-09-15");
  });
});

describe("utilidades", () => {
  it("genera slugs sin acentos", () => {
    expect(slugify("¡Jornada de Reforestación en Año 2026!")).toBe("jornada-de-reforestacion-en-ano-2026");
  });

  it("arma enlaces de WhatsApp", () => {
    expect(whatsappLink("52 33 1638 7462", "Hola")).toBe("https://wa.me/523316387462?text=Hola");
  });
});

describe("permisos", () => {
  it("restringe módulos según el rol", () => {
    expect(can("admin", "users")).toBe(true);
    expect(can("tesoreria", "finance")).toBe(true);
    expect(can("tesoreria", "users")).toBe(false);
    expect(can("comunicacion", "finance")).toBe(false);
    expect(can("secretaria", "content")).toBe(true);
  });
});

describe("configuración del sitio", () => {
  it("usa valores por defecto para campos faltantes o inválidos", () => {
    const settings = resolveSiteSettings({ phone: "33 1234 5678", email: "no-es-correo" });
    expect(settings.phone).toBe("33 1234 5678");
    expect(settings.email).toBe(DEFAULT_SITE_SETTINGS.email);
  });

  it("interpreta la mesa directiva", () => {
    expect(parseBoard("Presidencia | Ana López\nlínea inválida\nTesorería|Juan Pérez")).toEqual([
      { role: "Presidencia", name: "Ana López" },
      { role: "Tesorería", name: "Juan Pérez" },
    ]);
  });
});
