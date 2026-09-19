import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination";

describe("Pagination Component", () => {
  it("renders total items count", () => {
    render(
      <MemoryRouter>
        <Pagination page={1} pageCount={1} total={25} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/25/)).toBeInTheDocument();
    expect(screen.getByText(/registros/)).toBeInTheDocument();
  });

  it("renders navigation buttons when pageCount > 1", () => {
    render(
      <MemoryRouter initialEntries={["/admin/miembros?page=2"]}>
        <Pagination page={2} pageCount={5} total={100} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Anterior/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Siguiente/i })).toBeInTheDocument();
    expect(screen.getByText(/página/)).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    render(
      <MemoryRouter initialEntries={["/admin/miembros?page=1"]}>
        <Pagination page={1} pageCount={3} total={60} />
      </MemoryRouter>,
    );

    const prevSpan = screen.getByText(/Anterior/i);
    expect(prevSpan.closest("span")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: /Siguiente/i })).toBeInTheDocument();
  });
});
