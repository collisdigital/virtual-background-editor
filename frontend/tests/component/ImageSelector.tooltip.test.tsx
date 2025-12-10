import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImageSelector from '../../src/components/ImageSelector';
import { backgrounds } from '../../src/config/backgrounds';

describe('ImageSelector', () => {
  it('should display a tooltip with the background name on hover', () => {
    const mockOnSelect = vi.fn();
    render(<ImageSelector backgrounds={backgrounds} onSelect={mockOnSelect} />);

    // Get the first background image button
    const firstImageButton = screen.getByRole('button', { name: `Select ${backgrounds[0].name} as background` });

    // Check if the title attribute (tooltip) matches the background name
    expect(firstImageButton).toHaveAttribute('title', backgrounds[0].name);
  });
});
