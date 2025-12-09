import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ImageSelector from '../../src/components/ImageSelector';
import { backgrounds } from '../../src/config/backgrounds';

describe('ImageSelector', () => {
  it('renders a list of background images', () => {
    render(<ImageSelector backgrounds={backgrounds} onSelect={() => undefined} />);
    const images = screen.getAllByRole('button');
    expect(images).toHaveLength(backgrounds.length);
  });
});
