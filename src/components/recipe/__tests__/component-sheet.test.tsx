import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentSheet } from "../component-sheet";
import type { RecipeComponentWithRecipe } from "@/lib/types";

const link: RecipeComponentWithRecipe = {
  id: "link-1",
  parent_recipe_id: "parent-1",
  component_recipe_id: "comp-1",
  ingredient_group_label: "Tikka Masala Sauce",
  display_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  component: {
    id: "comp-1",
    title: "Tikka Masala Sauce",
    source: "curated",
    is_component: true,
    component_type: "sauce",
    servings: 4,
    description: "Rich tomato-cream base",
    created_at: "2026-01-01T00:00:00Z",
    ingredients: [
      { name: "crushed tomatoes", amount: 400, unit: "g" },
      { name: "heavy cream", amount: 200, unit: "ml" },
    ],
  },
};

describe("ComponentSheet", () => {
  it("renders nothing when link is null", () => {
    const { container } = render(
      <ComponentSheet link={null} onClose={jest.fn()} onOpenFull={jest.fn()} onSave={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders component title when link is provided", () => {
    render(<ComponentSheet link={link} onClose={jest.fn()} onOpenFull={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByText("Tikka Masala Sauce")).toBeInTheDocument();
  });

  it("renders ingredient amounts at base servings", () => {
    render(<ComponentSheet link={link} onClose={jest.fn()} onOpenFull={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByText(/400g crushed tomatoes/)).toBeInTheDocument();
  });

  it("scales ingredient amounts when servings increase", () => {
    render(<ComponentSheet link={link} onClose={jest.fn()} onOpenFull={jest.fn()} onSave={jest.fn()} />);
    const plusBtn = screen.getByRole("button", { name: "+" });
    fireEvent.click(plusBtn);
    // 5/4 * 400 = 500
    expect(screen.getByText(/500g crushed tomatoes/)).toBeInTheDocument();
  });

  it("does not go below 1 serving", () => {
    render(<ComponentSheet link={link} onClose={jest.fn()} onOpenFull={jest.fn()} onSave={jest.fn()} />);
    const minusBtn = screen.getByRole("button", { name: "−" });
    for (let i = 0; i < 5; i++) fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(<ComponentSheet link={link} onClose={onClose} onOpenFull={jest.fn()} onSave={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onOpenFull with component id when Open full recipe is clicked", () => {
    const onOpenFull = jest.fn();
    render(<ComponentSheet link={link} onClose={jest.fn()} onOpenFull={onOpenFull} onSave={jest.fn()} />);
    fireEvent.click(screen.getByText("Open full recipe →"));
    expect(onOpenFull).toHaveBeenCalledWith("comp-1");
  });

  it("calls onSave with component id when Save button is clicked", () => {
    const onSave = jest.fn();
    render(<ComponentSheet link={link} onClose={jest.fn()} onOpenFull={jest.fn()} onSave={onSave} />);
    fireEvent.click(screen.getByText("Save to my components"));
    expect(onSave).toHaveBeenCalledWith("comp-1");
  });
});
