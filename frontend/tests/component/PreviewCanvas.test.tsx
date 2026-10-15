import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PreviewCanvas from '../../src/components/PreviewCanvas';

describe('PreviewCanvas', () => {
  it('renders a canvas element', () => {
    render(<PreviewCanvas />);
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
  });

  it('shows empty bounds before an element is selected', () => {
    render(<PreviewCanvas />);
    for (const input of screen.getAllByRole('spinbutton')) {
      expect(input).toBeDisabled();
      expect(input).toHaveValue(null);
    }
  });

  it('shows the selected bounds rounded to one decimal place', () => {
    render(<PreviewCanvas selectedElementBounds={{ x: 100.123, y: -20.56, width: 300, height: 80.25 }} />);
    expect(screen.getByLabelText('X in image pixels')).toHaveValue(100.1);
    expect(screen.getByLabelText('Y in image pixels')).toHaveValue(-20.6);
    expect(screen.getByLabelText('Width in image pixels')).toHaveValue(300);
    expect(screen.getByLabelText('Height in image pixels')).toHaveValue(80.3);
  });

  it('commits numeric edits on Enter and blur', async () => {
    const user = userEvent.setup();
    const onBoundsChange = vi.fn();
    render(<PreviewCanvas selectedElementBounds={{ x: 10, y: 20, width: 300, height: 80 }} onBoundsChange={onBoundsChange} />);
    const x = screen.getByLabelText('X in image pixels');
    await user.clear(x);
    await user.type(x, '-25.5{Enter}');
    expect(onBoundsChange).toHaveBeenCalledExactlyOnceWith('x', -25.5);

    const width = screen.getByLabelText('Width in image pixels');
    await user.clear(width);
    await user.type(width, '450');
    await user.tab();
    expect(onBoundsChange).toHaveBeenLastCalledWith('width', 450);
  });

  it('cancels with Escape and rejects empty or non-positive sizes', async () => {
    const user = userEvent.setup();
    const onBoundsChange = vi.fn();
    render(<PreviewCanvas selectedElementBounds={{ x: 10, y: 20, width: 300, height: 80 }} onBoundsChange={onBoundsChange} />);
    const width = screen.getByLabelText('Width in image pixels');
    await user.clear(width);
    await user.type(width, '500{Escape}');
    expect(width).toHaveValue(300);
    await user.clear(width);
    await user.type(width, '0{Enter}');
    await user.clear(width);
    await user.type(width, '-10{Enter}');
    await user.clear(width);
    await user.tab();
    expect(onBoundsChange).not.toHaveBeenCalled();
    expect(width).toHaveValue(300);
  });

  it('does not commit rounded values when focus leaves an unchanged field', async () => {
    const user = userEvent.setup();
    const onBoundsChange = vi.fn();
    render(<PreviewCanvas selectedElementBounds={{ x: 10.123, y: 20, width: 300, height: 80 }} onBoundsChange={onBoundsChange} />);
    await user.click(screen.getByLabelText('X in image pixels'));
    await user.tab();
    expect(onBoundsChange).not.toHaveBeenCalled();
  });

  it.each([
    ['X', 'x', 11],
    ['Y', 'y', 19],
    ['Width', 'width', 301],
    ['Height', 'height', 79],
  ])('commits %s spinner changes immediately without blur', (label, field, nextValue) => {
    const onBoundsChange = vi.fn();
    render(<PreviewCanvas selectedElementBounds={{ x: 10, y: 20, width: 300, height: 80 }} onBoundsChange={onBoundsChange} />);
    const input = screen.getByLabelText(`${label} in image pixels`);
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: String(nextValue) } });
    expect(onBoundsChange).toHaveBeenCalledExactlyOnceWith(field, nextValue);
    fireEvent.blur(input);
    expect(onBoundsChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('step', '1');
    if (field === 'width' || field === 'height') {
      expect(input).toHaveAttribute('min', '1');
    }
  });

  it('keeps typing as a draft until explicitly committed', async () => {
    const user = userEvent.setup();
    const onBoundsChange = vi.fn();
    render(<PreviewCanvas selectedElementBounds={{ x: 10, y: 20, width: 300, height: 80 }} onBoundsChange={onBoundsChange} />);
    const input = screen.getByLabelText('X in image pixels');
    await user.clear(input);
    await user.type(input, '123');
    expect(onBoundsChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onBoundsChange).toHaveBeenCalledExactlyOnceWith('x', 123);
  });
});
