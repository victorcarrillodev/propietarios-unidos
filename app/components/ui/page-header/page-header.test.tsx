import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader Component", () => {
  it("renders main title and description", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Panel de Miembros"
          description="Gestión y padrón de integrantes de la asociación."
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Panel de Miembros")).toBeInTheDocument();
    expect(screen.getByText("Gestión y padrón de integrantes de la asociación.")).toBeInTheDocument();
  });

  it("renders back button link when back prop is provided", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Nuevo Miembro"
          back={{ to: "/admin/miembros", label: "Volver a miembros" }}
        />
      </MemoryRouter>,
    );

    const backLink = screen.getByRole("link", { name: /Volver a miembros/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/admin/miembros");
  });

  it("renders breadcrumbs trail properly", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Detalle de Pago"
          breadcrumbs={[
            { label: "Inicio", to: "/admin" },
            { label: "Pagos", to: "/admin/pagos" },
            { label: "Folio 105" },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Migajas de pan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pagos" })).toBeInTheDocument();
    expect(screen.getByText("Folio 105")).toBeInTheDocument();
  });
});
