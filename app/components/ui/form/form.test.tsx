import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckboxField, Field, Honeypot, SelectField, TextareaField, TextField } from "./index";

describe("Form Fields Components", () => {
  it("renders TextField with label and accessible error", () => {
    render(
      <TextField
        label="Nombre del predio"
        name="propertyName"
        placeholder="Ej. Los Pinos"
        error="El nombre es obligatorio"
        required
      />,
    );

    const input = screen.getByLabelText(/Nombre del predio/i);
    expect(input).toBeInTheDocument();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("renders TextField with hint when there are no errors", () => {
    render(
      <TextField
        label="Superficie"
        name="area"
        hint="Expresada en hectáreas"
      />,
    );

    expect(screen.getByText("Expresada en hectáreas")).toBeInTheDocument();
  });

  it("renders TextareaField and allows typing", () => {
    render(
      <TextareaField
        label="Descripción de hechos"
        name="description"
        defaultValue="Texto inicial"
      />,
    );

    const textarea = screen.getByLabelText("Descripción de hechos");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Texto inicial");

    fireEvent.change(textarea, { target: { value: "Nuevo texto ingresado" } });
    expect(textarea).toHaveValue("Nuevo texto ingresado");
  });

  it("renders SelectField with options and placeholder", () => {
    const options = [
      { value: "privada", label: "Propiedad privada" },
      { value: "ejidal", label: "Régimen ejidal" },
    ];

    render(
      <SelectField
        label="Régimen de propiedad"
        name="tenure"
        placeholder="Selecciona uno"
        options={options}
      />,
    );

    const select = screen.getByLabelText("Régimen de propiedad");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Selecciona uno" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Propiedad privada" })).toBeInTheDocument();
  });

  it("renders CheckboxField and responds to user toggle", () => {
    render(
      <CheckboxField
        label="Acepto los términos y aviso de privacidad"
        name="terms"
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Acepto los términos y aviso de privacidad" });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("renders Honeypot anti-spam input hidden from sighted users", () => {
    const { container } = render(<Honeypot />);
    const wrapper = container.querySelector("div[aria-hidden='true']");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("overflow-hidden");
  });
});
