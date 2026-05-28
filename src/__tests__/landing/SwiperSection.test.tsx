import { render, screen } from '@testing-library/react';
import { SwiperSection } from '@/components/landing/SwiperSection';

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  })) as unknown as typeof IntersectionObserver;
});

const heroRecipe = { id: 'hero1', title: 'Lamb Tagine', image_url: '/t.jpg', cuisine_type: 'Moroccan', cook_time_minutes: 45, calories: 520 };
const moreRecipes = [
  { id: '2', title: 'Ramen', image_url: '/r.jpg', cuisine_type: 'Japanese', cook_time_minutes: 30, calories: 400 },
];

describe('SwiperSection', () => {
  it('renders the hero recipe as first card', () => {
    render(<SwiperSection heroRecipe={heroRecipe} moreRecipes={moreRecipes} />);
    expect(screen.getByText('Lamb Tagine')).toBeInTheDocument();
  });

  it('has the correct section id for scroll targeting', () => {
    const { container } = render(<SwiperSection heroRecipe={heroRecipe} moreRecipes={moreRecipes} />);
    expect(container.querySelector('#swiper-section')).toBeInTheDocument();
  });
});
