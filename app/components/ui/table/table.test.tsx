import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableContainer, TBody, Td, Th, THead, Tr } from "./table";

describe("Table Components", () => {
  it("renders TableContainer with responsive wrapper", () => {
    const { container } = render(
      <TableContainer>
        <tbody>
          <tr>
            <td>Dato</td>
          </tr>
        </tbody>
      </TableContainer>,
    );

    expect(container.firstChild).toHaveClass("overflow-x-auto");
  });

  it("renders semantic table structure with headers and rows", () => {
    render(
      <Table>
        <THead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Monto</Th>
          </Tr>
        </THead>
        <TBody>
          <Tr clickable>
            <Td>Juan Pérez</Td>
            <Td>$1,200.00</Td>
          </Tr>
        </TBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Monto")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("$1,200.00")).toBeInTheDocument();
  });
});
