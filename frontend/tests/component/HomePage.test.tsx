import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../../src/pages/HomePage';
import { backgrounds } from '../../src/config/backgrounds';
import { useImageProcessor } from '../../src/hooks/useImageProcessor';

vi.mock('../../src/hooks/useImageProcessor', () => ({
  useImageProcessor: vi.fn((_ref, initialState) => ({
    selectImage: vi.fn(), updateText: vi.fn(), downloadImage: vi.fn(),
    updateCymraegStatus: vi.fn(), cymraegStatus: initialState.cymraegStatus,
    imageLoadingError: null, selectedElementBounds: null,
  })),
}));

const storageKey = 'virtual-background-editor.settings';

describe('HomePage persistence', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('restores controls, the selected thumbnail, and initial canvas values', () => {
    localStorage.setItem(storageKey, JSON.stringify({
      name: 'Jane Doe', jobTitle: 'Engineer',
      backgroundId: backgrounds[0].id, cymraegStatus: 'Fluent',
    }));
    render(<HomePage />);
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Job Title')).toHaveValue('Engineer');
    expect(screen.getByLabelText('Cymraeg')).toHaveValue('Fluent');
    expect(screen.getByTestId(`bg-select-${backgrounds[0].id}`)).toHaveAttribute('aria-pressed', 'true');
    expect(useImageProcessor).toHaveBeenLastCalledWith(expect.anything(), {
      image: expect.objectContaining({
        id: backgrounds[0].id,
        src: `${import.meta.env.BASE_URL}${backgrounds[0].src.slice(1)}`,
      }),
      textValues: { name: 'Jane Doe', title: 'Engineer' }, cymraegStatus: 'Fluent',
    });
  });

  it('saves user edits and choices and restores them on remount', async () => {
    const user = userEvent.setup();
    const first = render(<HomePage />);
    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Job Title'), 'Engineer');
    await user.selectOptions(screen.getByLabelText('Cymraeg'), 'Learner');
    await user.click(screen.getByTestId(`bg-select-${backgrounds[1].id}`));
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      name: 'Jane Doe', jobTitle: 'Engineer',
      backgroundId: backgrounds[1].id, cymraegStatus: 'Learner',
    });
    first.unmount();
    render(<HomePage />);
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Job Title')).toHaveValue('Engineer');
    expect(screen.getByLabelText('Cymraeg')).toHaveValue('Learner');
    expect(screen.getByTestId(`bg-select-${backgrounds[1].id}`)).toHaveAttribute('aria-pressed', 'true');
  });
});