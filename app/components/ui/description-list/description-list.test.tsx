import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DescriptionList } from "./description-list";

describe("DescriptionList Component", () => {
  it("renders labels and values in definition list", () => {
    const items = [
      { label: "Titular", value: "Carlos Santana" },
      { label: "Superficie", value: "15.4 hectáreas" },
      { label: "Observaciones", value: null },
    ];

    render(<DescriptionList items={items} />);

    expect(screen.getByText("Titular")).toBeInTheDocument();
    expect(screen.getByText("Carlos Santana")).toBeInTheDocument();
    expect(screen.getByText("Superficie")).toBeInTheDocument();
    expect(screen.getByText("15.4 hectáreas")).toBeInTheDocument();
    expect(screen.getByText("Observaciones")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
