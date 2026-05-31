import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentCardStrip } from "../component-card-strip";
import type { RecipeComponentWithRecipe } from "@/lib/types";

const links: RecipeComponentWithRecipe[] = [
  {
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
      cook_time_minutes: 15,
      description: "Rich tomato-cream base",
      created_at: "2026-01-01T00:00:00Z",
      ingredients: [],
    },
  },
];

describe("ComponentCardStrip", () => {
  it("renders nothing when links array is empty", () => {
    const { container } = render(<ComponentCardStrip links={[]} onView={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section heading", () => {
    render(<ComponentCardStrip links={links} onView={jest.fn()} />);
    expect(screen.getByText(/Building Blocks/i)).toBeInTheDocument();
  });

  it("renders component title", () => {
    render(<ComponentCardStrip links={links} onView={jest.fn()} />);
    expect(screen.getByText("Tikka Masala Sauce")).toBeInTheDocument();
  });

  it("renders type label and cook time", () => {
    render(<ComponentCardStrip links={links} onView={jest.fn()} />);
    expect(screen.getByText(/Sauce/)).toBeInTheDocument();
    expect(screen.getByText(/15 min/)).toBeInTheDocument();
  });

  it("calls onView with component id when card is clicked", () => {
    const onView = jest.fn();
    render(<ComponentCardStrip links={links} onView={onView} />);
    fireEvent.click(screen.getByText("Tikka Masala Sauce"));
    expect(onView).toHaveBeenCalledWith("comp-1");
  });
});
