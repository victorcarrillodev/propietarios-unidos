import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { createRoutesStub } from "react-router";
import { ConfirmButton } from "./confirm-button";

function renderConfirmButton() {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: () => (
        <form method="post">
          <input type="hidden" name="intent" value="delete" />
          <ConfirmButton message="¿Eliminar este registro?" variant="danger">
            Eliminar
          </ConfirmButton>
        </form>
      ),
    },
  ]);
  return render(<Stub />);
}

describe("ConfirmButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the confirmation dialog instead of submitting right away", () => {
    const requestSubmit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(() => {});
    renderConfirmButton();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("¿Eliminar este registro?")).toBeInTheDocument();
    expect(requestSubmit).not.toHaveBeenCalled();
  });

  it("closes without submitting when the user cancels", () => {
    const requestSubmit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(() => {});
    renderConfirmButton();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(requestSubmit).not.toHaveBeenCalled();
  });

  it("submits the owning form with the trigger as submitter when confirmed", () => {
    const requestSubmit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(() => {});
    renderConfirmButton();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(requestSubmit.mock.calls[0]?.[0]).toHaveAttribute("type", "submit");
  });
});
