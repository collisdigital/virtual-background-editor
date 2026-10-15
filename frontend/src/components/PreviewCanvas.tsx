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
  return (
    <div className="w-full min-w-0">
      <div id="preview-container" className="w-full min-h-[300px] bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
        <canvas ref={ref} role="presentation" className="max-w-full max-h-full block"></canvas>
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
