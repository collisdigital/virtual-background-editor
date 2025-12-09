import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ImageSelector from '../../src/components/ImageSelector';
import { backgrounds } from '../../src/config/backgrounds';

describe('ImageSelector - Configuration Loading', () => {
  it('loads and displays images based on the provided configuration', () => {
    // This test implicitly covers the configuration loading by using the 'backgrounds' import.
    // The previous ImageSelector test already verifies the rendering of these backgrounds.
    // However, to explicitly test the 'configuration-based image loading', we can ensure
    // that the 'backgrounds' array is not empty and that ImageSelector attempts to render them.

    expect(backgrounds.length).toBeGreaterThan(0); // Ensure there are backgrounds configured

    render(<ImageSelector backgrounds={backgrounds} onSelect={() => undefined} />);

    // Verify that images are rendered based on the configuration
    backgrounds.forEach((bg) => {
      expect(screen.getByAltText(bg.name)).toBeInTheDocument();
    });
  });
});
