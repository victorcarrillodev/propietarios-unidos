import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";
import { Modal } from "./modal";

describe("Modal & ConfirmDialog Components", () => {
  it("does not render when open is false", () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Contenido modal
      </Modal>,
    );
    expect(screen.queryByText("Contenido modal")).not.toBeInTheDocument();
  });

  it("renders content and title when open is true", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Título Modal" description="Descripción Modal">
        <p>Cuerpo del diálogo</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Título Modal")).toBeInTheDocument();
    expect(screen.getByText("Descripción Modal")).toBeInTheDocument();
    expect(screen.getByText("Cuerpo del diálogo")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Cerrable">
        Cuerpo
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar modal" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Escape Test">
        Cuerpo
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders ConfirmDialog and handles confirm and cancel clicks", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="¿Eliminar elemento?"
        description="Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="No, regresar"
      />
    );

    expect(screen.getByText("¿Eliminar elemento?")).toBeInTheDocument();
    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "No, regresar" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
