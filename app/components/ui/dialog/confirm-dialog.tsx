import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button/button";
import { Modal } from "./modal";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "primary" | "accent";
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : tone === "accent" ? "accent" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            tone === "danger"
              ? "bg-red-50 text-red-600 ring-1 ring-red-200"
              : "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
          }`}
        >
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
          {description && <div className="mt-2 text-sm leading-relaxed text-stone-600">{description}</div>}
        </div>
      </div>
    </Modal>
  );
}
