import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentIngredientGroup } from "../component-ingredient-group";
import type { RecipeComponentWithRecipe } from "@/lib/types";

const mockLink: RecipeComponentWithRecipe = {
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
    created_at: "2026-01-01T00:00:00Z",
    ingredients: [
      { name: "crushed tomatoes", amount: 400, unit: "g" },
      { name: "garam masala", amount: 1, unit: "tbsp" },
      { name: "heavy cream", amount: 200, unit: "ml" },
    ],
  },
};

describe("ComponentIngredientGroup", () => {
  it("renders the ingredient_group_label in uppercase", () => {
    render(<ComponentIngredientGroup link={mockLink} onView={jest.fn()} />);
    expect(screen.getByText(/TIKKA MASALA SAUCE/)).toBeInTheDocument();
  });

  it("renders all component ingredients", () => {
    render(<ComponentIngredientGroup link={mockLink} onView={jest.fn()} />);
    expect(screen.getByText(/crushed tomatoes/)).toBeInTheDocument();
    expect(screen.getByText(/garam masala/)).toBeInTheDocument();
    expect(screen.getByText(/heavy cream/)).toBeInTheDocument();
  });

  it("calls onView with component id when View button is clicked", () => {
    const onView = jest.fn();
    render(<ComponentIngredientGroup link={mockLink} onView={onView} />);
    fireEvent.click(screen.getByText("View →"));
    expect(onView).toHaveBeenCalledWith("comp-1");
  });

  it("renders ingredient amounts and units", () => {
    render(<ComponentIngredientGroup link={mockLink} onView={jest.fn()} />);
    expect(screen.getByText(/400g crushed tomatoes/)).toBeInTheDocument();
  });
});
