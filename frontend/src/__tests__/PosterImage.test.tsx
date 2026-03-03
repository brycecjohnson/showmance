import { render, screen, fireEvent } from '@testing-library/react';
import { PosterImage } from '../components/ui/PosterImage';

describe('PosterImage', () => {
  it('shows fallback SVG when the image fails to load', () => {
    render(<PosterImage src="/bad.jpg" alt="Broken poster" />);

    const img = screen.getByRole('img');
    fireEvent.error(img);

    // After error, the fallback SVG should render (no img element anymore)
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // The fallback container has the poster-image--fallback class
    const fallback = document.querySelector('.poster-image--fallback');
    expect(fallback).toBeInTheDocument();
  });

  it('resets loaded/errored state when src changes', () => {
    const { rerender } = render(
      <PosterImage src="/poster-a.jpg" alt="Poster A" />,
    );

    // Trigger error on first src
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    // Change src — should reset to loading state (img visible again)
    rerender(<PosterImage src="/poster-b.jpg" alt="Poster B" />);

    const newImg = screen.getByRole('img');
    expect(newImg).toBeInTheDocument();
    expect(newImg).toHaveAttribute('src', '/poster-b.jpg');
  });
});
