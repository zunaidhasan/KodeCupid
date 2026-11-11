// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Toggle } from "./Toggle";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { ChipGroup } from "./Choice";
import { EmptyState } from "./EmptyState";

afterEach(cleanup);

describe("UI components", () => {
  it("Toggle is an accessible switch that flips on click", () => {
    const onChange = vi.fn();
    render(<Toggle label="Show my age" checked={false} onChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Show my age" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("Input associates its label and surfaces errors accessibly", () => {
    render(<Input label="Display name" error="Please enter a name" value="" onChange={() => undefined} />);
    const input = screen.getByLabelText("Display name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Please enter a name");
  });

  it("Modal renders a labelled dialog and closes on Escape", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Report user"><button>Inside</button></Modal>);
    expect(screen.getByRole("dialog", { name: "Report user" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("ChipGroup supports multi-select with aria-pressed", () => {
    function Harness() {
      const [v, setV] = useState<string[]>([]);
      return <ChipGroup label="Interests" options={[{ value: "a", label: "Hiking" }, { value: "b", label: "Baking" }]} value={v} onChange={setV} />;
    }
    render(<Harness />);
    const hiking = screen.getByRole("button", { name: "Hiking" });
    fireEvent.click(hiking);
    expect(hiking.getAttribute("aria-pressed")).toBe("true");
  });

  it("EmptyState shows title, description and action", () => {
    render(<EmptyState title="No matches yet" description="Keep exploring" action={<button>Discover</button>} />);
    expect(screen.getByText("No matches yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Discover" })).toBeTruthy();
  });
});
