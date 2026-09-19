import { render, screen } from "@testing-library/react";
import { FolderOpen } from "lucide-react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState Component", () => {
  it("renders title, description and icon", () => {
    render(
      <EmptyState
        icon={FolderOpen}
        title="Sin documentos registrados"
        description="Aún no se han subido actas ni comprobantes."
      />,
    );

    expect(screen.getByText("Sin documentos registrados")).toBeInTheDocument();
    expect(screen.getByText("Aún no se han subido actas ni comprobantes.")).toBeInTheDocument();
  });

  it("renders action element when provided", () => {
    render(
      <EmptyState
        icon={FolderOpen}
        title="Sin elementos"
        action={<button type="button">Crear nuevo</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Crear nuevo" })).toBeInTheDocument();
  });
});
