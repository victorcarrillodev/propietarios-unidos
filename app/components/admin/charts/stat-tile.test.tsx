import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { StatTile } from "./stat-tile";

describe("StatTile Component", () => {
  it("renders metric label, value and hint", () => {
    render(
      <StatTile
        label="Miembros activos"
        value="48"
        hint="5 pendientes · 2 inactivos"
        icon={Users}
      />,
    );

    expect(screen.getByText("Miembros activos")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("5 pendientes · 2 inactivos")).toBeInTheDocument();
  });

  it("renders as interactive link when 'to' prop is provided", () => {
    render(
      <MemoryRouter>
        <StatTile
          label="Ingresos del mes"
          value="$45,000"
          to="/admin/pagos"
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/admin/pagos");
    expect(screen.getByText("$45,000")).toBeInTheDocument();
  });

  it("renders trend badge when trend prop is provided", () => {
    render(
      <StatTile
        label="Ingresos"
        value="$12,000"
        trend={{ value: "+15%", positive: true }}
      />,
    );

    expect(screen.getByText("+15%")).toBeInTheDocument();
  });
});
