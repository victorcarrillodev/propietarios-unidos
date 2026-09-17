import { z } from "zod";
import { MEMBER_TYPES, REPORT_TYPES } from "../enums";
import {
  optionalDate,
  optionalDecimal,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredEmail,
  requiredPhone,
  requiredText,
  selectEnum,
} from "../validation";

const privacyConsent = z.literal("on", { error: "Debes aceptar el aviso de privacidad" });

export const contactSchema = z.object({
  name: requiredText("Tu nombre", 120),
  email: requiredEmail,
  phone: optionalPhone,
  subject: requiredText("El asunto", 150),
  message: requiredText("El mensaje", 4000),
  privacy: privacyConsent,
});

export const joinSchema = z.object({
  fullName: requiredText("Tu nombre completo", 150),
  email: requiredEmail,
  phone: requiredPhone,
  memberType: selectEnum(MEMBER_TYPES, "cómo quieres participar"),
  propertyName: optionalText(150),
  municipality: optionalText(80),
  locality: optionalText(150),
  areaHa: optionalDecimal,
  message: optionalText(2000),
  privacy: privacyConsent,
});

export const reportSchema = z.object({
  type: selectEnum(REPORT_TYPES, "el tipo de incidencia"),
  location: requiredText("La ubicación", 300),
  occurredOn: optionalDate.refine(
    (value) => value === null || new Date(value).getTime() <= Date.now() + 24 * 60 * 60 * 1000,
    "La fecha no puede estar en el futuro",
  ),
  description: requiredText("La descripción", 4000),
  reporterName: optionalText(120),
  reporterPhone: optionalPhone,
  reporterEmail: optionalEmail,
  privacy: privacyConsent,
});
