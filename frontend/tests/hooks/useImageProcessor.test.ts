import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useImageProcessor } from '../../src/hooks/useImageProcessor';
import { createLogoConfig, createPlaceholders } from '../../src/config/backgrounds';
import { fabricService } from '../../src/services/fabricService';
import type * as fabric from 'fabric';

const { 
  mockSet, 
  mockCanvasAdd, 
  mockCanvasRemove, 
  mockCanvasRenderAll, 
  mockRequestRenderAll, 
  mockGetObjects,
  mockCanvasOn,
  mockGetActiveObject,
  mockFabricImageFromURL
} = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockCanvasAdd: vi.fn(),
  mockCanvasRemove: vi.fn(),
  mockCanvasRenderAll: vi.fn(),
  mockRequestRenderAll: vi.fn(),
  mockGetObjects: vi.fn().mockReturnValue([]),
  mockCanvasOn: vi.fn(),
  mockGetActiveObject: vi.fn(),
  mockFabricImageFromURL: vi.fn(),
}));

vi.mock('fabric', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('fabric')>(),
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
      on = mockCanvasOn;
      getActiveObject = mockGetActiveObject;
    },
    FabricImage: {
      fromURL: mockFabricImageFromURL,
    },
    Textbox: class {
      constructor(text: string, options: Record<string, unknown>) {
        Object.assign(this, options);
      }
      set = mockSet;
      setCoords = vi.fn();
    },
    StaticCanvas: class {
      constructor(el: HTMLCanvasElement | null, options: fabric.CanvasOptions) {
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
    mockCanvasOn.mockImplementation(() => vi.fn());
    mockGetActiveObject.mockReturnValue(undefined);
    mockFabricImageFromURL.mockResolvedValue({
         set: mockSet,
         width: 2000,
         height: 1000
    });
    mockGetObjects.mockReturnValue([]);
  });

  it('exports the entire background at the canvas top-left', async () => {
    const { FabricImage } = await vi.importActual<typeof import('fabric')>('fabric');
    const dimensions = { width: 1920, height: 1080 };
    const background = new FabricImage(document.createElement('img'), dimensions);
    mockFabricImageFromURL.mockResolvedValueOnce(background);

    const canvas = await fabricService.generateDownloadCanvas(
      { id: '1', name: 'Test BG', src: 'test.png', placeholders: [] },
      dimensions,
      [],
      'None'
    );

    expect(canvas.width).toBe(dimensions.width);
    expect(canvas.height).toBe(dimensions.height);
    expect(canvas.backgroundImage).toBe(background);
    background.setCoords();
    expect(background.getBoundingRect()).toEqual({
      left: 0, top: 0, ...dimensions,
    });
  });

  it('uses edited image-space bounds for responsive layout and downloaded objects', async () => {
    const { FabricImage, Textbox } = await vi.importActual<typeof import('fabric')>('fabric');
    const placeholder = createPlaceholders(100, 100, 200, 200)[0];
    const text = new Textbox('Edited name', { originX: 'left', originY: 'top' }) as fabric.Textbox & {
      _placeholder: typeof placeholder;
      _editorBounds: { x: number; y: number; width: number; height: number; fontSize: number };
    };
    text._placeholder = placeholder;
    text._editorBounds = { x: 240, y: 180, width: 600, height: 160, fontSize: 80 };

    const backgroundImage = {
      width: 2000,
      height: 1000,
      set: vi.fn(),
    } as unknown as fabric.FabricImage;
    const layoutCanvas = {
      width: 1000,
      height: 500,
      backgroundImage,
      getObjects: () => [text],
      requestRenderAll: vi.fn(),
    } as unknown as fabric.Canvas;
    fabricService.updateLayout(layoutCanvas);
    expect(text.left).toBe(120);
    expect(text.top).toBe(90);
    expect(text.width).toBe(300);
    expect(text.fontSize).toBe(40);
    expect(text.getBoundingRect().height).toBeCloseTo(80);

    layoutCanvas.width = 500;
    layoutCanvas.height = 250;
    fabricService.updateLayout(layoutCanvas);
    expect(text.left).toBe(60);
    expect(text.top).toBe(45);
    expect(text.width).toBe(150);
    expect(text.fontSize).toBe(20);
    expect(text.getBoundingRect().height).toBeCloseTo(40);

    const background = { width: 2000, height: 1000, set: mockSet };
    const logoImage = { width: 100, height: 50, set: mockSet };
    mockFabricImageFromURL.mockResolvedValueOnce(background).mockResolvedValueOnce(logoImage);
    const logoConfig = createLogoConfig(300, 400);
    const logo = new FabricImage(document.createElement('img'), { width: 100, height: 50 }) as fabric.FabricImage & {
      name: string;
      _editorBounds: { x: number; y: number; width: number; height: number };
    };
    logo.name = 'cymraeg-logo';
    logo._editorBounds = { x: 900, y: 800, width: 300, height: 120 };
    const logoText = new Textbox('Dysgwyr\nLearner') as fabric.Textbox & {
      name: string;
      _editorBounds: { x: number; y: number; width: number; height: number; fontSize: number };
    };
    logoText.name = 'cymraeg-text';
    logoText._editorBounds = { x: 1250, y: 810, width: 180, height: 110, fontSize: 70 };

    const exported = await fabricService.generateDownloadCanvas(
      { id: '1', name: 'Test BG', src: 'test.png', placeholders: [placeholder], logoConfig },
      { width: 2000, height: 1000 },
      [text, logo, logoText],
      'Learner'
    );
    const [exportedText, exportedLogo, exportedLogoText] = mockCanvasAdd.mock.calls.map(([object]) => object) as fabric.FabricObject[];
    expect(exportedText.left).toBe(240);
    expect(exportedText.top).toBe(180);
    expect(exportedText.width).toBe(600);
    expect((exportedText as fabric.Textbox).fontSize).toBe(80);
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      left: 900, top: 800, scaleX: 3, scaleY: 2.4,
    }));
    expect(exportedLogo).toBeDefined();
    expect(exportedLogoText.left).toBe(1250);
    expect(exportedLogoText.top).toBe(810);
    expect(exportedLogoText.width).toBe(180);
    expect((exportedLogoText as fabric.Textbox).fontSize).toBe(70);
    expect(exportedLogoText).toBeDefined();
    exported.dispose();
  });

  it('restores the initial background, text, and Welsh logo after canvas initialization', async () => {
    const image = {
      id: '1', name: 'Test BG', src: 'test.png',
      placeholders: createPlaceholders(100, 100, 200, 200),
      logoConfig: createLogoConfig(100, 100),
    };
    const updateText = vi.spyOn(fabricService, 'updateText');
    const addLogo = vi.spyOn(fabricService, 'addLogo');
    try {
      const { result } = renderHook(() => useImageProcessor(
        { current: document.createElement('canvas') },
        { image, textValues: { name: 'Jane Doe', title: 'Engineer' }, cymraegStatus: 'Learner' }
      ));
      await waitFor(() => {
        expect(updateText).toHaveBeenCalledWith(expect.anything(), image, 'name', 'Jane Doe');
        expect(updateText).toHaveBeenCalledWith(expect.anything(), image, 'title', 'Engineer');
        expect(addLogo).toHaveBeenCalledWith(expect.anything(), image.logoConfig, 'Learner');
      });
      expect(mockFabricImageFromURL).toHaveBeenCalledWith('test.png', { crossOrigin: 'anonymous' });
      expect(result.current.cymraegStatus).toBe('Learner');
    } finally {
      updateText.mockRestore();
      addLogo.mockRestore();
    }
  });

  it('tracks image-space bounds through selection, transforms, and deselection', async () => {
    const canvasRef = { current: document.createElement('canvas') };
    const { result } = renderHook(() => useImageProcessor(canvasRef));
    expect(result.current.selectedElementBounds).toBeNull();

    const canvas = (canvasRef.current as HTMLCanvasElement & { __fabric: fabric.Canvas }).__fabric;
    canvas.backgroundImage = {
      width: 2000,
      getBoundingRect: () => ({ left: 20, top: 10, width: 1000, height: 500 }),
    } as fabric.FabricImage;
    const object = {
      setCoords: vi.fn(),
      getBoundingRect: vi.fn().mockReturnValue({ left: 70, top: 110, width: 150, height: 40 }),
    };
    mockGetActiveObject.mockReturnValue(object);
    const emit = (event: string) => {
      const listener = mockCanvasOn.mock.calls.find(([name]) => name === event)?.[1] as () => void;
      act(() => listener());
    };

    emit('selection:created');
    expect(result.current.selectedElementBounds).toEqual({ x: 100, y: 200, width: 300, height: 80 });

    object.getBoundingRect.mockReturnValue({ left: 120, top: 60, width: 200, height: 50 });
    emit('after:render');
    expect(result.current.selectedElementBounds).toEqual({ x: 200, y: 100, width: 400, height: 100 });

    mockGetActiveObject.mockReturnValue(undefined);
    emit('after:render');
    expect(result.current.selectedElementBounds).toEqual({ x: 200, y: 100, width: 400, height: 100 });

    mockGetActiveObject.mockReturnValue({
      setCoords: vi.fn(),
      getBoundingRect: () => ({ left: 20, top: 10, width: 50, height: 25 }),
    });
    emit('selection:updated');
    expect(result.current.selectedElementBounds).toEqual({ x: 0, y: 0, width: 100, height: 50 });

    mockGetActiveObject.mockReturnValue(undefined);
    await act(async () => {
      await result.current.selectImage({
        id: 'new', name: 'New background', src: 'new.png', placeholders: [],
      });
    });
    emit('after:render');
    expect(result.current.selectedElementBounds).toBeNull();
  });

  it('refreshes cached Fabric coordinates while an object is moving', async () => {
    const { Rect } = await vi.importActual<typeof import('fabric')>('fabric');
    const object = new Rect({ left: 10, top: 20, width: 100, height: 50, strokeWidth: 0, originX: 'left', originY: 'top' });
    object.setCoords();
    mockGetActiveObject.mockReturnValue(object);
    const { result } = renderHook(() => useImageProcessor({ current: document.createElement('canvas') }));
    const onRender = mockCanvasOn.mock.calls.find(([name]) => name === 'after:render')?.[1] as () => void;

    act(() => onRender());
    expect(result.current.selectedElementBounds).toEqual({ x: 10, y: 20, width: 100, height: 50 });

    object.set({ left: 40, top: 60, scaleX: 2 });
    act(() => onRender());
    expect(result.current.selectedElementBounds).toEqual({ x: 40, y: 60, width: 200, height: 50 });
  });

  it('unsubscribes from selection and render events on unmount', () => {
    const unsubscribe = vi.fn();
    mockCanvasOn.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() => useImageProcessor({ current: document.createElement('canvas') }));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(3);
  });

  it('edits image-space position and independent dimensions, including after deselection', async () => {
    const { Rect } = await vi.importActual<typeof import('fabric')>('fabric');
    const object = new Rect({ left: 70, top: 110, width: 150, height: 40, strokeWidth: 0, originX: 'left', originY: 'top' });
    mockGetActiveObject.mockReturnValue(object);
    mockGetObjects.mockReturnValue([object]);
    const canvasRef = { current: document.createElement('canvas') };
    const { result } = renderHook(() => useImageProcessor(canvasRef));
    const canvas = (canvasRef.current as HTMLCanvasElement & { __fabric: fabric.Canvas }).__fabric;
    canvas.backgroundImage = {
      width: 2000,
      getBoundingRect: () => ({ left: 20, top: 10, width: 1000, height: 500 }),
    } as fabric.FabricImage;
    const onRender = mockCanvasOn.mock.calls.find(([name]) => name === 'after:render')?.[1] as () => void;
    const edit = (field: 'x' | 'y' | 'width' | 'height', value: number) => {
      act(() => {
        result.current.updateSelectedElementBounds(field, value);
        onRender();
      });
    };

    edit('x', -50);
    edit('y', 60);
    edit('width', 600);
    edit('height', 120);
    expect(result.current.selectedElementBounds).toEqual({ x: -50, y: 60, width: 600, height: 120 });
    expect((object as fabric.FabricObject & { _editorBounds: { x: number; y: number; width: number; height: number } })._editorBounds)
      .toEqual({ x: -50, y: 60, width: 600, height: 120 });
    expect(mockRequestRenderAll).toHaveBeenCalled();

    mockGetActiveObject.mockReturnValue(undefined);
    edit('x', 200);
    expect(result.current.selectedElementBounds).toEqual({ x: 200, y: 60, width: 600, height: 120 });
    for (const value of [0, -1, NaN, Infinity]) edit('width', value);
    expect(result.current.selectedElementBounds?.width).toBe(600);

    mockGetObjects.mockReturnValue([]);
    edit('x', 400);
    expect(result.current.selectedElementBounds?.x).toBe(200);
  });

  it('resizes rotated items proportionally without moving the bounding box top-left', async () => {
    const { Rect } = await vi.importActual<typeof import('fabric')>('fabric');
    const object = new Rect({ left: 50, top: 60, width: 100, height: 40, angle: 30, strokeWidth: 0 });
    object.setCoords();
    const before = object.getBoundingRect();
    mockGetActiveObject.mockReturnValue(object);
    const { result } = renderHook(() => useImageProcessor({ current: document.createElement('canvas') }));
    act(() => result.current.updateSelectedElementBounds('width', before.width * 2));
    const after = object.getBoundingRect();
    expect(after.left).toBeCloseTo(before.left);
    expect(after.top).toBeCloseTo(before.top);
    expect(after.width).toBeCloseTo(before.width * 2);
    expect(after.height).toBeCloseTo(before.height * 2);
    expect(object.angle).toBe(30);
  });

  it('resizes text boxes and wraps text without scaling the letters', async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      measureText: (text: string) => ({ width: text.length * 200 }),
    } as CanvasRenderingContext2D);
    try {
      const { Textbox } = await vi.importActual<typeof import('fabric')>('fabric');
      const object = new Textbox('one two three four five six seven eight', {
        left: 70, top: 110, width: 500, fontSize: 20, strokeWidth: 1,
        scaleX: 0.75, scaleY: 0.75, originX: 'left', originY: 'top',
      });
      mockGetActiveObject.mockReturnValue(object);
      const canvasRef = { current: document.createElement('canvas') };
      const { result } = renderHook(() => useImageProcessor(canvasRef));
      const canvas = (canvasRef.current as HTMLCanvasElement & { __fabric: fabric.Canvas }).__fabric;
      canvas.backgroundImage = {
        width: 2000,
        getBoundingRect: () => ({ left: 20, top: 10, width: 1000, height: 500 }),
      } as fabric.FabricImage;
      const onRender = mockCanvasOn.mock.calls.find(([name]) => name === 'after:render')?.[1] as () => void;
      const originalLines = object.textLines.length;
      const originalHeight = object.height;

      act(() => {
        result.current.updateSelectedElementBounds('width', 200);
        onRender();
      });
      expect(object.textLines.length).toBeGreaterThan(originalLines);
      expect(object.height).toBeGreaterThan(originalHeight);
      expect(result.current.selectedElementBounds?.width).toBeCloseTo(200);
      expect(object.fontSize).toBe(20);
      expect(object.scaleX).toBe(0.75);
      expect(object.scaleY).toBe(0.75);
      expect(object.left).toBeCloseTo(70);
      expect(object.top).toBeCloseTo(110);

      act(() => {
        result.current.updateSelectedElementBounds('height', 400);
        onRender();
      });
      expect(result.current.selectedElementBounds?.height).toBeCloseTo(400);
      expect(object.fontSize).toBe(20);
      expect(object.scaleX).toBe(0.75);
      expect(object.scaleY).toBe(0.75);
      expect(object.left).toBeCloseTo(70);
      expect(object.top).toBeCloseTo(110);
    } finally {
      getContext.mockRestore();
    }
  });

  it('uses box resizing instead of text scaling for vertical and corner canvas handles', async () => {
    const { Rect } = await vi.importActual<typeof import('fabric')>('fabric');
    const canvasRef = { current: document.createElement('canvas') };
    const { result } = renderHook(() => useImageProcessor(canvasRef));
    const image = {
      id: '1', name: 'Test BG', src: 'test.png',
      placeholders: createPlaceholders(100, 100, 200, 200),
    };
    await act(async () => result.current.selectImage(image));
    act(() => result.current.updateText('name', 'Jane Doe'));
    const createdText = mockCanvasAdd.mock.calls.at(-1)?.[0] as fabric.Textbox;

    for (const key of ['mb', 'mt', 'br', 'tl']) {
      const object = new Rect({
        left: 10, top: 20, width: 100, height: 50,
        scaleX: 1, scaleY: 1, strokeWidth: 0, originX: 'left', originY: 'top',
      });
      object.controls = createdText.controls;
      const control = object.controls[key];
      const transform = {
        target: object, corner: key, originX: 'left', originY: 'top',
        scaleX: 1, scaleY: 1,
      } as fabric.Transform;
      expect(control.actionName).toBe('resizing');
      control.actionHandler!({} as fabric.TPointerEvent, transform, 160, 120);
      expect(object.height).not.toBe(50);
      expect(object.scaleX).toBe(1);
      expect(object.scaleY).toBe(1);
    }
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
      placeholders: createPlaceholders(100, 100, 200, 200),
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
      placeholders: createPlaceholders(100, 100, 200, 200),
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

  it('should position placeholder text from its configured top-left coordinates', async () => {
    const container = document.createElement('div');
    container.id = 'preview-container';
    Object.defineProperty(container, 'clientWidth', { value: 1000 });
    document.body.appendChild(container);

    const canvasEl = document.createElement('canvas');
    const canvasRef = { current: canvasEl };
    const { result } = renderHook(() => useImageProcessor(canvasRef));
    const imageConfig = {
      id: '1',
      name: 'Test BG',
      src: 'test.png',
      placeholders: createPlaceholders(100, 120, 200, 220),
    };

    await act(async () => {
      await result.current.selectImage(imageConfig);
    });

    mockSet.mockClear();
    await act(async () => {
      result.current.updateText('name', 'Jane Doe');
    });

    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      left: 50,
      top: 60,
      width: 900,
      fontSize: 45,
      originX: 'left',
      originY: 'top',
    }));

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
      placeholders: createPlaceholders(100, 100, 200, 200),
      logoConfig: createLogoConfig(100, 100)
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
      placeholders: createPlaceholders(100, 100, 200, 200),
      logoConfig: createLogoConfig(100, 100)
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
        placeholders: createPlaceholders(100, 100, 200, 200),
        logoConfig: createLogoConfig(100, 100)
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
      placeholders: createPlaceholders(100, 100, 200, 200),
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
      placeholders: createPlaceholders(100, 100, 200, 200),
      logoConfig: createLogoConfig(100, 100)
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
