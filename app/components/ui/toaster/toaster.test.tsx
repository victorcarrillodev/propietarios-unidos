import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toaster } from "./toaster";

describe("Toaster Component", () => {
  it("does not render when toast is null", () => {
    const { container } = render(<Toaster toast={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders success toast message with appropriate styling", () => {
    render(<Toaster toast={{ id: "1", type: "success", message: "Guardado con éxito" }} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Guardado con éxito")).toBeInTheDocument();
  });

  it("dismisses toast when close button is clicked", () => {
    render(<Toaster toast={{ id: "2", type: "error", message: "Ocurrió un fallo" }} />);
    const closeBtn = screen.getByRole("button", { name: "Cerrar aviso" });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(screen.queryByText("Ocurrió un fallo")).not.toBeInTheDocument();
  });
});
