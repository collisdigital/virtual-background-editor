import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useImageProcessor } from '../../src/hooks/useImageProcessor';

// Mocking fabric.js
vi.mock('fabric', () => {
  return {
    Canvas: class {
      dispose = vi.fn();
      requestRenderAll = vi.fn();
      renderAll = vi.fn();
      getObjects = vi.fn().mockReturnValue([]);
      remove = vi.fn();
      add = vi.fn();
      width = 1920;
      height = 1080;
    },
    FabricImage: {
      fromURL: vi.fn().mockResolvedValue({
         set: vi.fn(),
         width: 100,
         height: 100
      }),
    },
    Textbox: vi.fn(),
  };
});

describe('useImageProcessor', () => {
  it('should trigger a download when downloadImage is called', () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = {
      current: canvasEl,
    };

    const linkMock = document.createElement('a');
    const linkClickSpy = vi.spyOn(linkMock, 'click');
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock);

    const { result } = renderHook(() => useImageProcessor(canvasRef));

    result.current.downloadImage();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(linkMock.download).toBe('virtual-background.png');
    expect(linkClickSpy).toHaveBeenCalled();
  });
});
