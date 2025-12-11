import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useImageProcessor } from '../../src/hooks/useImageProcessor';

const { 
  mockSet, 
  mockCanvasAdd, 
  mockCanvasRemove, 
  mockCanvasRenderAll, 
  mockRequestRenderAll, 
  mockGetObjects,
  mockFabricImageFromURL
} = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockCanvasAdd: vi.fn(),
  mockCanvasRemove: vi.fn(),
  mockCanvasRenderAll: vi.fn(),
  mockRequestRenderAll: vi.fn(),
  mockGetObjects: vi.fn().mockReturnValue([]),
  mockFabricImageFromURL: vi.fn(),
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
      fromURL: mockFabricImageFromURL,
    },
    Textbox: class {
      constructor(text: string, options: any) {
        (this as any).text = text;
        Object.assign(this, options);
      }
      set = mockSet;
      setCoords = vi.fn();
    },
    StaticCanvas: class {
      constructor(el: HTMLCanvasElement | null, options: any) {
        Object.assign(this, options);
      }
      dispose = vi.fn();
      setBackgroundImage = vi.fn();
      getObjects = mockGetObjects; // Re-use the same mock for objects
      add = mockCanvasAdd; // Re-use the same mock for adding objects
      renderAll = mockCanvasRenderAll; // Re-use renderAll
      toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mocked_image_data');
      width = 2000; // Mock full resolution width
      height = 1000; // Mock full resolution height
    },
  };
});

describe('useImageProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFabricImageFromURL.mockResolvedValue({
         set: mockSet,
         width: 2000,
         height: 1000
    });
    mockGetObjects.mockReturnValue([]);
  });

  it('should trigger a download when downloadImage is called', async () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };

    const linkMock = document.createElement('a');
    const linkClickSpy = vi.spyOn(linkMock, 'click');
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock);

    const { result } = renderHook(() => useImageProcessor(canvasRef));

    const mockImageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: [],
      originalWidth: 2000,
      originalHeight: 1000,
    };
    await act(async () => {
      await result.current.selectImage(mockImageConfig);
    });

    await act(async () => {
      await result.current.downloadImage();
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(linkMock.download).toBe('test-Personalised.png');
    expect(linkClickSpy).toHaveBeenCalled();
  });

  it('should scale image correctly on selectImage', async () => {
    // Setup container
    const container = document.createElement('div');
    container.id = 'preview-container';
    Object.defineProperty(container, 'clientWidth', { value: 1000 });
    Object.defineProperty(container, 'clientHeight', { value: 500 });
    document.body.appendChild(container);

    const canvasEl = document.createElement('canvas');
    Object.defineProperty(canvasEl, 'clientWidth', { value: 1000 });
    Object.defineProperty(canvasEl, 'clientHeight', { value: 500 });
    // Note: In real app canvas is inside container, but here we just need container to exist for ID lookup
    const canvasRef = { current: canvasEl };

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

    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      scaleX: 0.5,
      scaleY: 0.5,
      originX: 'center',
      originY: 'center',
    }));
    
    // Cleanup
    document.body.removeChild(container);
  });

  it('should add logo when cymraegStatus is updated', async () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };
    const { result } = renderHook(() => useImageProcessor(canvasRef));

    const mockImageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: [],
      logoConfig: { x: 100, y: 100, width: 50 }
    };

    await act(async () => {
      await result.current.selectImage(mockImageConfig);
    });

    // Clear previous calls (from selectImage)
    mockSet.mockClear();
    mockCanvasAdd.mockClear();

    await act(async () => {
      await result.current.updateCymraegStatus('Learner');
    });

    // Check if set was called with logo name
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      name: 'cymraeg-logo'
    }));
    // Check if canvas.add was called
    expect(mockCanvasAdd).toHaveBeenCalled();
  });

  it('should remove existing logo before adding new one', async () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };
    const { result } = renderHook(() => useImageProcessor(canvasRef));

    const mockImageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: [],
      logoConfig: { x: 100, y: 100, width: 50 }
    };

    await act(async () => {
      await result.current.selectImage(mockImageConfig);
    });

    // Mock an existing logo object
    const existingLogo = { name: 'cymraeg-logo' };
    mockGetObjects.mockReturnValue([existingLogo]);

    await act(async () => {
      await result.current.updateCymraegStatus('Fluent');
    });

    expect(mockCanvasRemove).toHaveBeenCalledWith(existingLogo);
    expect(mockCanvasAdd).toHaveBeenCalled(); // Adds the new one
  });

  it('should just remove logo if status is None', async () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };
    const { result } = renderHook(() => useImageProcessor(canvasRef));
    const mockImageConfig = {
        id: '1',
        name: 'Test BG',
        src: 'test.png',
        placeholders: [],
        logoConfig: { x: 100, y: 100, width: 50 }
    };
    await act(async () => {
        await result.current.selectImage(mockImageConfig);
    });

    // Mock an existing logo object
    const existingLogo = { name: 'cymraeg-logo' };
    mockGetObjects.mockReturnValue([existingLogo]);
    // Clear adds from selectImage
    mockCanvasAdd.mockClear();

    await act(async () => {
      await result.current.updateCymraegStatus('None');
    });

    expect(mockCanvasRemove).toHaveBeenCalledWith(existingLogo);
    expect(mockCanvasAdd).not.toHaveBeenCalled();
  });

  it('should update existing text object without removing it', async () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };
    const { result } = renderHook(() => useImageProcessor(canvasRef));

    const mockImageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: [
          { id: 'name', x: 0, y: 0, width: 100, font: 'Arial', fontSize: 20, fill: 'black', textAlign: 'left' as const }
      ],
    };
    await act(async () => {
        await result.current.selectImage(mockImageConfig);
    });

    // Mock existing object
    const existingTextObj = { name: 'name', set: vi.fn() };
    mockGetObjects.mockReturnValue([existingTextObj]);
    mockCanvasAdd.mockClear();
    mockCanvasRemove.mockClear();

    await act(async () => {
       result.current.updateText('name', 'New Text');
    });

    expect(existingTextObj.set).toHaveBeenCalledWith({ text: 'New Text' });
    expect(mockCanvasRemove).not.toHaveBeenCalled();
    expect(mockCanvasAdd).not.toHaveBeenCalled();
  });

  it('should update existing logo text without removing objects', async () => {
    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };
    const { result } = renderHook(() => useImageProcessor(canvasRef));

    const mockImageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: [],
      logoConfig: { x: 100, y: 100, width: 50 }
    };
    await act(async () => {
        await result.current.selectImage(mockImageConfig);
    });

    // Mock existing objects
    const existingLogo = { name: 'cymraeg-logo' };
    const existingText = { name: 'cymraeg-text', set: vi.fn() };
    mockGetObjects.mockReturnValue([existingLogo, existingText]);
    
    mockCanvasAdd.mockClear();
    mockCanvasRemove.mockClear();

    await act(async () => {
      await result.current.updateCymraegStatus('Fluent');
    });

    expect(existingText.set).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('Fluent') }));
    expect(mockCanvasRemove).not.toHaveBeenCalled();
    expect(mockCanvasAdd).not.toHaveBeenCalled();
  });
});
