import { Form } from "react-router";
import { ButtonLink, SubmitButton } from "~/components/ui/button";
import { Card } from "~/components/ui/data";
import { SelectField, TextareaField, TextField } from "~/components/ui/form";
import type { Member } from "~/db/schema";
import { MEMBER_STATUS_LABELS, MEMBER_TYPE_LABELS, toOptions } from "~/lib/labels";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  member?: Pick<Member, "fullName" | "memberType" | "status" | "email" | "phone" | "address" | "joinedOn" | "notes">;
  errors?: FieldErrors;
  values?: Record<string, string>;
  submitLabel: string;
  cancelTo: string;
};

export function MemberForm({ member, errors, values, submitLabel, cancelTo }: Props) {
  const value = (name: keyof NonNullable<Props["member"]>) => values?.[name] ?? member?.[name] ?? "";
  return (
    <Form method="post">
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Nombre completo"
            name="fullName"
            defaultValue={value("fullName")}
            error={errors?.fullName}
            required
            className="md:col-span-2"
          />
          <SelectField
            label="Tipo de miembro"
            name="memberType"
            options={toOptions(MEMBER_TYPE_LABELS)}
            defaultValue={value("memberType") || "propietario"}
            error={errors?.memberType}
            required
          />
          <SelectField
            label="Estado"
            name="status"
            options={toOptions(MEMBER_STATUS_LABELS)}
            defaultValue={value("status") || "activo"}
            error={errors?.status}
            required
          />
          <TextField label="Correo electrónico" name="email" type="email" defaultValue={value("email")} error={errors?.email} />
          <TextField label="Teléfono / WhatsApp" name="phone" type="tel" defaultValue={value("phone")} error={errors?.phone} />
          <TextField
            label="Domicilio"
            name="address"
            defaultValue={value("address")}
            error={errors?.address}
            className="md:col-span-2"
          />
          <TextField
            label="Fecha de ingreso"
            name="joinedOn"
            type="date"
            defaultValue={value("joinedOn")}
            error={errors?.joinedOn}
          />
          <TextareaField
            label="Notas internas"
            name="notes"
            rows={3}
            defaultValue={value("notes")}
            error={errors?.notes}
            hint="Solo visibles en el panel."
            className="md:col-span-2"
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-5">
          <ButtonLink to={cancelTo} variant="ghost">
            Cancelar
          </ButtonLink>
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </Card>
    </Form>
  );
}
