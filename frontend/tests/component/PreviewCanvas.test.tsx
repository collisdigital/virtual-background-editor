import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PreviewCanvas from '../../src/components/PreviewCanvas';

describe('PreviewCanvas', () => {
  it('adds independent full-span rulers and removes them without changing the canvas', async () => {
    const user = userEvent.setup();
    render(<PreviewCanvas />);
    const canvas = screen.getByRole('presentation');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Horizontal ruler'));
    await user.click(screen.getByLabelText('Vertical ruler'));
    const horizontal = screen.getByRole('separator', { name: 'horizontal alignment ruler' });
    const vertical = screen.getByRole('separator', { name: 'vertical alignment ruler' });
    expect(horizontal).toHaveStyle({ top: '50%' });
    expect(horizontal).toHaveClass('w-full');
    expect(vertical).toHaveStyle({ left: '50%' });
    expect(vertical).toHaveClass('h-full');
    fireEvent.change(screen.getByLabelText('horizontal ruler position'), { target: { value: '25' } });
    expect(horizontal).toHaveStyle({ top: '25%' });
    expect(vertical).toHaveStyle({ left: '50%' });
    await user.click(screen.getByLabelText('Horizontal ruler'));
    expect(screen.queryByRole('separator', { name: 'horizontal alignment ruler' })).not.toBeInTheDocument();
    expect(vertical).toBeInTheDocument();
    expect(screen.getByRole('presentation')).toBe(canvas);
  });

  it('moves rulers with the keyboard and clamps them to preview edges', async () => {
    const user = userEvent.setup();
    render(<PreviewCanvas />);
    await user.click(screen.getByLabelText('Vertical ruler'));
    const ruler = screen.getByRole('separator');
    ruler.focus();
    await user.keyboard('{ArrowLeft}');
    expect(ruler).toHaveAttribute('aria-valuenow', '49');
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(ruler).toHaveAttribute('aria-valuenow', '59');
    await user.keyboard('{End}{ArrowRight}');
    expect(ruler).toHaveStyle({ left: '100%' });
    await user.keyboard('{Home}{ArrowLeft}');
    expect(ruler).toHaveStyle({ left: '0%' });
  });

  it.each(['horizontal', 'vertical'] as const)('drags the %s ruler relative to the preview and clamps its position', async (orientation) => {
    const user = userEvent.setup();
    render(<PreviewCanvas />);
    await user.click(screen.getByLabelText(`${orientation === 'horizontal' ? 'Horizontal' : 'Vertical'} ruler`));
    const ruler = screen.getByRole('separator');
    const capture = vi.fn();
    const release = vi.fn();
    const hasCapture = vi.fn(() => false);
    Object.assign(ruler, { setPointerCapture: capture, releasePointerCapture: release, hasPointerCapture: hasCapture });
    vi.spyOn(ruler.parentElement!, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 50, width: 400, height: 200,
    } as DOMRect);
    fireEvent(ruler, new MouseEvent('pointermove', { bubbles: true, clientX: 200, clientY: 100 }));
    expect(ruler).toHaveAttribute('aria-valuenow', '50');
    fireEvent.pointerDown(ruler);
    expect(capture).toHaveBeenCalledTimes(1);
    hasCapture.mockReturnValue(true);
    fireEvent(ruler, new MouseEvent('pointermove', { bubbles: true, clientX: 200, clientY: 100 }));
    expect(ruler).toHaveAttribute('aria-valuenow', '25');
    fireEvent(ruler, new MouseEvent('pointermove', { bubbles: true, clientX: -100, clientY: -100 }));
    expect(ruler).toHaveAttribute('aria-valuenow', '0');
    fireEvent(ruler, new MouseEvent('pointermove', { bubbles: true, clientX: 1000, clientY: 1000 }));
    expect(ruler).toHaveAttribute('aria-valuenow', '100');
    fireEvent.pointerUp(ruler);
    expect(release).toHaveBeenCalledTimes(1);
  });

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
