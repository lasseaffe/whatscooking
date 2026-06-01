import React from "react";
import { render, screen } from "@testing-library/react";
import { ComponentFullPageBanner } from "../component-full-page-banner";

describe("ComponentFullPageBanner", () => {
  it("renders nothing when recipe is not a component", () => {
    const { container } = render(
      <ComponentFullPageBanner
        isComponent={false}
        componentType={null}
        parentRecipeCount={0}
        firstParentTitle={null}
        firstParentId={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Building Block' label when isComponent is true", () => {
    render(
      <ComponentFullPageBanner
        isComponent={true}
        componentType="sauce"
        parentRecipeCount={14}
        firstParentTitle="Chicken Tikka Masala"
        firstParentId="recipe-1"
      />
    );
    expect(screen.getByText(/Building Block/)).toBeInTheDocument();
  });

  it("renders the parent recipe title", () => {
    render(
      <ComponentFullPageBanner
        isComponent={true}
        componentType="sauce"
        parentRecipeCount={14}
        firstParentTitle="Chicken Tikka Masala"
        firstParentId="recipe-1"
      />
    );
    expect(screen.getByText(/Chicken Tikka Masala/)).toBeInTheDocument();
  });

  it("renders parent count when more than 1", () => {
    render(
      <ComponentFullPageBanner
        isComponent={true}
        componentType="sauce"
        parentRecipeCount={14}
        firstParentTitle="Chicken Tikka Masala"
        firstParentId="recipe-1"
      />
    );
    expect(screen.getByText(/13 other/)).toBeInTheDocument();
  });
});
