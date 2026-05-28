import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/landing/HeroSection';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => <a href={href} {...rest}>{children}</a>,
}));

// Mock ScrollStrip to avoid IntersectionObserver dependency
jest.mock('@/components/landing/ScrollStrip', () => ({
  ScrollStrip: () => <div data-testid="scroll-strip" />,
}));

// Mock useAmbilight to avoid canvas/image API
jest.mock('@/components/landing/useAmbilight', () => ({
  useAmbilight: () => 'rgba(10,5,3,1)',
}));

beforeAll(() => {
  global.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() })) as unknown as typeof IntersectionObserver;
});

const heroRecipe = {
  id: 'abc',
  title: 'Spaghetti Carbonara',
  image_url: '/img.jpg',
  cuisine_type: 'Italian',
  cook_time_minutes: 25,
  calories: 480,
};

const stripRecipes = [
  { id: '1', title: 'Tagine', image_url: '/t.jpg' },
  { id: '2', title: 'Ramen', image_url: '/r.jpg' },
];

describe('HeroSection', () => {
  it('renders the hero dish title', () => {
    render(<HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes} />);
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
  });

  it('renders GET STARTED CTA', () => {
    render(<HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes} />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders scroll hint', () => {
    render(<HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes} />);
    expect(screen.getByText("Swipe Tonight's Dinner")).toBeInTheDocument();
  });
});
