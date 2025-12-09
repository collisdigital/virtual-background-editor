import { forwardRef } from 'react';

const PreviewCanvas = forwardRef<HTMLCanvasElement>((_, ref) => {
  return (
    <div id="preview-container" className="w-full h-full min-h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
      <canvas ref={ref} role="presentation" className="max-w-full max-h-full block"></canvas>
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';

export default PreviewCanvas;
