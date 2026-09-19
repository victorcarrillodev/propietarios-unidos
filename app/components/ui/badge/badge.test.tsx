import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge Component", () => {
  it("renders children text correctly", () => {
    render(<Badge>Activo</Badge>);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("applies tone styles properly", () => {
    const { container: greenBadge } = render(<Badge tone="green">Vigente</Badge>);
    expect(greenBadge.firstChild).toHaveClass("bg-forest-50");

    const { container: redBadge } = render(<Badge tone="red">Adeudo</Badge>);
    expect(redBadge.firstChild).toHaveClass("bg-red-50");

    const { container: amberBadge } = render(<Badge tone="amber">Pendiente</Badge>);
    expect(amberBadge.firstChild).toHaveClass("bg-amber-50");
  });

  it("renders status dot when dot prop is true", () => {
    const { container } = render(<Badge tone="green" dot>En curso</Badge>);
    const dotSpan = container.querySelector("span[aria-hidden='true']");
    expect(dotSpan).toBeInTheDocument();
    expect(dotSpan).toHaveClass("bg-forest-500");
  });

  it("supports small and medium sizes", () => {
    const { container: sm } = render(<Badge size="sm">Pequeño</Badge>);
    expect(sm.firstChild).toHaveClass("text-xs");

    const { container: md } = render(<Badge size="md">Mediano</Badge>);
    expect(md.firstChild).toHaveClass("px-2.5");
  });
});
