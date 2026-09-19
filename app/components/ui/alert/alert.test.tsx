import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "./alert";

describe("Alert Component", () => {
  it("renders with status role for info/success and alert role for error", () => {
    const { rerender } = render(<Alert tone="info">Mensaje informativo</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<Alert tone="error">Error crítico</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders title and children content", () => {
    render(
      <Alert title="Atención" tone="warning">
        Por favor verifique los datos.
      </Alert>,
    );

    expect(screen.getByText("Atención")).toBeInTheDocument();
    expect(screen.getByText("Por favor verifique los datos.")).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", () => {
    const handleDismiss = vi.fn();
    render(
      <Alert tone="info" onDismiss={handleDismiss}>
        Aviso descartable
      </Alert>,
    );

    const closeBtn = screen.getByRole("button", { name: "Cerrar aviso" });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
