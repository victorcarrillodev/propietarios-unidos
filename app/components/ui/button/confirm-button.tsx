import { useRef, useState } from "react";
import { useNavigation } from "react-router";
import { ConfirmDialog } from "../dialog/confirm-dialog";
import { Button, type ButtonProps } from "./button";

/** Botón que pide confirmación en un modal (en vez del confirm() nativo) antes de enviar el formulario que lo contiene. */
export function ConfirmButton({ message, type = "submit", variant, disabled, confirmLabel, ...props }: ButtonProps & { message: string; confirmLabel?: string }) {
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const pending = confirming && navigation.state !== "idle";
  const tone = variant === "accent" ? "accent" : variant === "danger" || variant === "ghost" ? "danger" : "primary";

  return (
    <>
      <Button
        type={type}
        variant={variant}
        disabled={disabled || pending}
        onClick={(event) => {
          event.preventDefault();
          triggerRef.current = event.currentTarget;
          setOpen(true);
        }}
        {...props}
      />
      <ConfirmDialog
        open={open}
        loading={pending}
        tone={tone}
        confirmText={confirmLabel ?? (tone === "danger" ? "Eliminar" : "Confirmar")}
        title={message}
        description={tone === "danger" ? "Esta acción no se puede deshacer." : undefined}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setConfirming(true);
          triggerRef.current?.form?.requestSubmit(triggerRef.current);
        }}
      />
    </>
  );
}
