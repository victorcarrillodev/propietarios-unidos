import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { Button, ButtonLink, buttonClasses } from "./button";

describe("Button Component", () => {
  it("renders with default type button and text", () => {
    render(<Button>Guardar</Button>);
    const btn = screen.getByRole("button", { name: "Guardar" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
  });

  it("applies primary, secondary, and danger variant classes", () => {
    const { rerender } = render(<Button variant="primary">Principal</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-forest-700");

    rerender(<Button variant="secondary">Secundario</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-white");

    rerender(<Button variant="danger">Eliminar</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-red-600");
  });

  it("disables the button when disabled prop is set", () => {
    render(<Button disabled>Deshabilitado</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clic</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("buttonClasses utility returns consistent classes", () => {
    const classes = buttonClasses({ variant: "accent", size: "lg" });
    expect(classes).toContain("bg-amber-400");
    expect(classes).toContain("h-12");
  });

  it("renders ButtonLink within a router", () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/admin">Ir al panel</ButtonLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Ir al panel" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/admin");
  });
});
