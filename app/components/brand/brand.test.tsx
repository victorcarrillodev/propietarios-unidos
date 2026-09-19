import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FacebookIcon, ForestLandscape, Logo, LogoMark, TopoPattern } from "./index";

describe("Brand Components", () => {
  it("renders Logo with textual label and mark", () => {
    render(<Logo />);
    expect(screen.getByText("Propietarios Unidos")).toBeInTheDocument();
    expect(screen.getByText("Bosque La Primavera")).toBeInTheDocument();
  });

  it("renders Logo with light theme for dark backgrounds", () => {
    render(<Logo light />);
    expect(screen.getByText("Propietarios Unidos")).toHaveClass("text-white");
  });

  it("renders LogoMark SVG with accessibility attributes", () => {
    const { container } = render(<LogoMark className="size-12" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders TopoPattern SVG decoration", () => {
    const { container } = render(<TopoPattern />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders ForestLandscape SVG illustration", () => {
    const { container } = render(<ForestLandscape />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders FacebookIcon SVG", () => {
    const { container } = render(<FacebookIcon className="size-5" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
