import { describe, expect, it } from "vitest";
import { memberSchema, paymentSchema, recordSchema } from "./schemas/admin";
import { contactSchema } from "./schemas/public";
import { likeEscape, pickEnum, validateForm } from "./validation";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

describe("validateForm", () => {
  it("normaliza campos opcionales vacíos a null", () => {
    const result = validateForm(
      memberSchema,
      form({ fullName: "  Ana López ", memberType: "propietario", status: "activo", email: "", phone: "", joinedOn: "" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Ana López");
      expect(result.data.email).toBeNull();
      expect(result.data.joinedOn).toBeNull();
    }
  });

  it("devuelve errores por campo y conserva lo escrito", () => {
    const result = validateForm(memberSchema, form({ fullName: "", memberType: "otro", status: "activo", email: "mal" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.fullName?.[0]).toMatch(/obligatorio/);
      expect(result.errors.memberType).toBeDefined();
      expect(result.errors.email?.[0]).toMatch(/inválido/);
      expect(result.values.email).toBe("mal");
    }
  });

  it("exige miembro o nombre de quien paga y convierte el monto a centavos", () => {
    const base = { concept: "cuota", amount: "1,200", paidOn: "2026-09-16", method: "efectivo" };
    const withoutPayer = validateForm(paymentSchema, form(base));
    expect(withoutPayer.success).toBe(false);

    const donation = validateForm(paymentSchema, form({ ...base, concept: "donativo", payerName: "Vecinos de Tala" }));
    expect(donation.success).toBe(true);
    if (donation.success) expect(donation.data.amount).toBe(120000);

    const badPeriod = validateForm(paymentSchema, form({ ...base, payerName: "X", period: "2026-13" }));
    expect(badPeriod.success).toBe(false);
  });

  it("interpreta checkboxes y números opcionales", () => {
    const result = validateForm(
      recordSchema,
      form({ type: "vigilancia", title: "Recorrido", occurredOn: "2026-09-01", participants: "7", isPublic: "on" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
      expect(result.data.participants).toBe(7);
    }
  });

  it("requiere aceptar el aviso de privacidad en formularios públicos", () => {
    const result = validateForm(contactSchema, form({ name: "Ana", email: "ana@ejemplo.mx", subject: "Hola", message: "Mensaje" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.privacy?.[0]).toMatch(/aviso de privacidad/);
  });
});

describe("helpers", () => {
  it("escapa comodines de LIKE", () => {
    expect(likeEscape("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });

  it("solo acepta valores permitidos", () => {
    expect(pickEnum("activo", ["activo", "inactivo"])).toBe("activo");
    expect(pickEnum("hackeo", ["activo", "inactivo"])).toBe("");
    expect(pickEnum(null, ["activo"])).toBe("");
  });
});
