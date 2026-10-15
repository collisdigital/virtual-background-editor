import { forwardRef, useRef, useState } from 'react';
import type { SelectedElementBounds } from '../hooks/useImageProcessor';

interface PreviewCanvasProps {
  selectedElementBounds?: SelectedElementBounds | null;
  onBoundsChange?: (field: keyof SelectedElementBounds, value: number) => void;
}

const BoundsInput = ({ field, value, onCommit }: {
  field: keyof SelectedElementBounds;
  value: number | undefined;
  onCommit?: (field: keyof SelectedElementBounds, value: number) => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelCommit = useRef(false);
  const formattedValue = value === undefined ? '' : String(Math.round(value * 10) / 10);
  const isSize = field === 'width' || field === 'height';
  const label = field === 'x' || field === 'y' ? field.toUpperCase() : field === 'width' ? 'Width' : 'Height';

  return (
    <label className="flex min-w-0 items-center gap-1">
      <span>{label}:</span>
      <input
        type="number"
        aria-label={`${label} in image pixels`}
        step="1"
        min={isSize ? 1 : undefined}
        disabled={value === undefined || !onCommit}
        placeholder="--"
        value={draft ?? formattedValue}
        onFocus={() => setDraft(formattedValue)}
        onChange={(event) => {
          const nextDraft = event.target.value;
          const inputType = (event.nativeEvent as InputEvent).inputType;
          const nextValue = Number(nextDraft);
          if ((!inputType || inputType === 'insertReplacementText') && nextDraft.trim() !== ''
            && Number.isFinite(nextValue) && (!isSize || nextValue > 0)) {
            onCommit?.(field, nextValue);
            setDraft(null);
          } else {
            setDraft(nextDraft);
          }
        }}
        onBlur={() => {
          const nextValue = Number(draft);
          if (!cancelCommit.current && draft !== null && draft.trim() !== ''
            && Number.isFinite(nextValue) && (!isSize || nextValue > 0)
            && nextValue !== Number(formattedValue)) {
            onCommit?.(field, nextValue);
          }
          cancelCommit.current = false;
          setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            cancelCommit.current = event.key === 'Escape';
            event.currentTarget.blur();
          }
        }}
        className="w-full min-w-0 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1 py-1 text-inherit tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent"
      />
      <span>px</span>
    </label>
  );
};

const PreviewCanvas = forwardRef<HTMLCanvasElement, PreviewCanvasProps>(({ selectedElementBounds, onBoundsChange }, ref) => {
  const [rulers, setRulers] = useState<Record<'horizontal' | 'vertical', number | null>>({
    horizontal: null,
    vertical: null,
  });
  const setRulerPosition = (orientation: 'horizontal' | 'vertical', position: number) => {
    setRulers((previous) => ({ ...previous, [orientation]: Math.max(0, Math.min(100, position)) }));
  };

  return (
    <div className="w-full min-w-0">
      <div role="group" aria-label="Alignment rulers" className="flex flex-wrap gap-x-6 gap-y-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
        {(['horizontal', 'vertical'] as const).map((orientation) => (
          <div key={orientation} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rulers[orientation] !== null}
                onChange={(event) => setRulers((previous) => ({ ...previous, [orientation]: event.target.checked ? 50 : null }))}
              />
              {orientation === 'horizontal' ? 'Horizontal ruler' : 'Vertical ruler'}
            </label>
            {rulers[orientation] !== null && (
              <label className="flex items-center gap-1">
                <input
                  type="range"
                  aria-label={`${orientation} ruler position`}
                  min="0"
                  max="100"
                  step="0.1"
                  value={rulers[orientation]}
                  onChange={(event) => setRulerPosition(orientation, Number(event.target.value))}
                  className="w-20"
                />
                <span className="w-12 text-right tabular-nums">{Math.round(rulers[orientation] * 10) / 10}%</span>
              </label>
            )}
          </div>
        ))}
      </div>
      <div id="preview-container" className="w-full min-h-[300px] bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
        <div className="relative w-full">
          <canvas ref={ref} role="presentation" className="max-w-full max-h-full block"></canvas>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {(['horizontal', 'vertical'] as const).map((orientation) => {
              const position = rulers[orientation];
              if (position === null) return null;
              const horizontal = orientation === 'horizontal';
              return (
                <div
                  key={orientation}
                  role="separator"
                  tabIndex={0}
                  aria-label={`${orientation} alignment ruler`}
                  aria-orientation={orientation}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={position}
                  aria-valuetext={`${Math.round(position * 10) / 10}%`}
                  title={`${horizontal ? 'Horizontal' : 'Vertical'} alignment ruler`}
                  className={`pointer-events-auto absolute touch-none focus-visible:outline-2 focus-visible:outline-white ${horizontal ? 'left-0 h-3 w-full -translate-y-1/2 cursor-ns-resize' : 'top-0 h-full w-3 -translate-x-1/2 cursor-ew-resize'}`}
                  style={horizontal ? { top: `${position}%` } : { left: `${position}%` }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.focus();
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
                    const size = horizontal ? bounds.height : bounds.width;
                    if (!size) return;
                    const offset = horizontal ? event.clientY - bounds.top : event.clientX - bounds.left;
                    setRulerPosition(orientation, offset / size * 100);
                  }}
                  onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
                  onKeyDown={(event) => {
                    const decrease = horizontal ? 'ArrowUp' : 'ArrowLeft';
                    const increase = horizontal ? 'ArrowDown' : 'ArrowRight';
                    if (![decrease, increase, 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    const step = event.shiftKey ? 10 : 1;
                    setRulerPosition(orientation, event.key === 'Home' ? 0 : event.key === 'End' ? 100 : position + (event.key === decrease ? -step : step));
                  }}
                >
                  <span className={`absolute pointer-events-none ${horizontal ? 'left-0 top-1/2 w-full border-t border-dashed border-cyan-400 shadow-[0_1px_0_#000]' : 'top-0 left-1/2 h-full border-l border-dashed border-pink-400 shadow-[1px_0_0_#000]'}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div role="group" aria-label="Selected element bounds in image pixels" className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs tabular-nums text-gray-600 dark:text-gray-300">
        {(['x', 'y', 'width', 'height'] as const).map((key) => (
          <BoundsInput key={key} field={key} value={selectedElementBounds?.[key]} onCommit={onBoundsChange} />
        ))}
      </div>
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';

export default PreviewCanvas;
