import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useImageProcessor } from '../../src/hooks/useImageProcessor';

const { 
  mockSet, 
  mockCanvasAdd, 
  mockCanvasRemove, 
  mockCanvasRenderAll, 
  mockRequestRenderAll, 
  mockGetObjects 
} = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockCanvasAdd: vi.fn(),
  mockCanvasRemove: vi.fn(),
  mockCanvasRenderAll: vi.fn(),
  mockRequestRenderAll: vi.fn(),
  mockGetObjects: vi.fn().mockReturnValue([]),
}));

vi.mock('fabric', () => {
  return {
    Canvas: class {
      dispose = vi.fn();
      requestRenderAll = mockRequestRenderAll;
      renderAll = mockCanvasRenderAll;
      getObjects = mockGetObjects;
      remove = mockCanvasRemove;
      add = mockCanvasAdd;
      width = 1000;
      height = 500;
      backgroundImage = null;
      setDimensions = vi.fn();
      clear = vi.fn();
    },
    FabricImage: {
      fromURL: vi.fn().mockResolvedValue({
         set: mockSet,
         width: 2000,
         height: 1000
      }),
    },
    Textbox: class {
      constructor(text: string, options: any) {
        (this as any).text = text;
        Object.assign(this, options);
      }
      set = mockSet;
      setCoords = vi.fn();
    },
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

  it('should scale image correctly on selectImage', async () => {
    const canvasEl = document.createElement('canvas');
    // Mock parent element for resize observer logic if needed, but selectImage uses canvas dimensions
    Object.defineProperty(canvasEl, 'clientWidth', { value: 1000 });
    Object.defineProperty(canvasEl, 'clientHeight', { value: 500 });
    
    const canvasRef = {
      current: canvasEl,
    };

    const { result } = renderHook(() => useImageProcessor(canvasRef));

    const mockImageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: [
        { id: 'name', x: 100, y: 50, width: 200, font: 'Arial', fontSize: 20, fill: 'black', textAlign: 'left' as const }
      ]
    };

    await act(async () => {
      await result.current.selectImage(mockImageConfig);
    });

    // Image is 2000x1000, Canvas is 1000x500. Scale should be 0.5.
    // However, logic uses Math.max(canvasW/imgW, canvasH/imgH).
    // 1000/2000 = 0.5. 500/1000 = 0.5. Max is 0.5.
    
    // Check if set was called with expected scale on the image
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      scaleX: 0.5,
      scaleY: 0.5,
      originX: 'center',
      originY: 'center',
    }));
  });
});
