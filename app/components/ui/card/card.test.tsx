import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card";

describe("Card Component", () => {
  it("renders body children", () => {
    render(<Card>Contenido del card</Card>);
    expect(screen.getByText("Contenido del card")).toBeInTheDocument();
  });

  it("renders title and description in header when provided", () => {
    render(
      <Card
        title="Título de prueba"
        description="Descripción detallada"
        actions={<button type="button">Acción</button>}
      >
        Cuerpo
      </Card>,
    );

    expect(screen.getByText("Título de prueba")).toBeInTheDocument();
    expect(screen.getByText("Descripción detallada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acción" })).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <Card footer={<p>Pie de página</p>}>
        Cuerpo
      </Card>,
    );

    expect(screen.getByText("Pie de página")).toBeInTheDocument();
  });

  it("applies elevated and hoverable styles when requested", () => {
    const { container } = render(
      <Card variant="elevated" hoverable>
        Card elevado
      </Card>,
    );

    expect(container.firstChild).toHaveClass("shadow-sm");
    expect(container.firstChild).toHaveClass("hover:shadow-md");
  });
});
