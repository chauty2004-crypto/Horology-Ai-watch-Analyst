import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner Component', () => {
  it('should render the spinner', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should have animation class', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div');
    expect(spinner?.className).toContain('animate');
  });
});
