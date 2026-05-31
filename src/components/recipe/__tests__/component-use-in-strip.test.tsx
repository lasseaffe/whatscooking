import React from "react";
import { render, screen } from "@testing-library/react";
import { ComponentUseInStrip } from "../component-use-in-strip";

const parents = [
  { id: "r-1", title: "Chicken Tikka Masala", image_url: null },
  { id: "r-2", title: "Shakshuka Twist", image_url: null },
];

describe("ComponentUseInStrip", () => {
  it("renders nothing when parents array is empty", () => {
    const { container } = render(<ComponentUseInStrip parents={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section heading", () => {
    render(<ComponentUseInStrip parents={parents} />);
    expect(screen.getByText(/Use this/i)).toBeInTheDocument();
  });

  it("renders all parent recipe titles", () => {
    render(<ComponentUseInStrip parents={parents} />);
    expect(screen.getByText("Chicken Tikka Masala")).toBeInTheDocument();
    expect(screen.getByText("Shakshuka Twist")).toBeInTheDocument();
  });

  it("each title links to the recipe page", () => {
    render(<ComponentUseInStrip parents={parents} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/recipes/r-1");
    expect(links[1]).toHaveAttribute("href", "/recipes/r-2");
  });
});
