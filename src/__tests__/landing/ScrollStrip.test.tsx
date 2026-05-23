import { render, screen } from '@testing-library/react';
import { ScrollStrip } from '@/components/landing/ScrollStrip';

// jsdom does not implement IntersectionObserver — provide a no-op mock
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

const recipes = [
  { id: '1', title: 'Carbonara', image_url: '/img1.jpg' },
  { id: '2', title: 'Tagine', image_url: '/img2.jpg' },
  { id: '3', title: 'Pho Bo', image_url: '/img3.jpg' },
  { id: '4', title: 'Shakshuka', image_url: '/img4.jpg' },
  { id: '5', title: 'Ramen', image_url: '/img5.jpg' },
  { id: '6', title: 'Butter Chicken', image_url: '/img6.jpg' },
];

describe('ScrollStrip', () => {
  it('renders all recipe titles', () => {
    render(<ScrollStrip recipes={recipes} onImageVisible={() => {}} />);
    expect(screen.getAllByText('Carbonara').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tagine').length).toBeGreaterThan(0);
  });

  it('renders three columns', () => {
    const { container } = render(<ScrollStrip recipes={recipes} onImageVisible={() => {}} />);
    expect(container.querySelectorAll('[data-col]').length).toBe(3);
  });
});
