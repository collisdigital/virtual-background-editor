import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { BackgroundImage } from '../config/backgrounds';
import { fabricService } from '../services/fabricService';

interface FabricCanvasElement extends HTMLCanvasElement {
  __fabric?: fabric.Canvas;
}

export interface SelectedElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InitialEditorState {
  image: BackgroundImage | null;
  textValues: Record<string, string>;
  cymraegStatus: 'None' | 'Learner' | 'Fluent';
}

const getImageMetrics = (canvas: fabric.Canvas) => {
  const background = canvas.backgroundImage;
  if (background && typeof background.setCoords === 'function') background.setCoords();
  const bounds = background?.getBoundingRect();
  return {
    left: bounds?.left ?? 0,
    top: bounds?.top ?? 0,
    scale: background && bounds && background.width ? bounds.width / background.width : 1,
  };
};

export const useImageProcessor = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  initialState?: InitialEditorState
) => {
  const [restoredState] = useState(initialState);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedImage, setSelectedImage] = useState<BackgroundImage | null>(
    null
  );
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageLoadingError, setImageLoadingError] = useState<string | null>(null);
  const [cymraegStatus, setCymraegStatus] = useState<'None' | 'Learner' | 'Fluent'>(restoredState?.cymraegStatus ?? 'None');
  const lastSelectedObject = useRef<fabric.FabricObject | null>(null);
  const [selectedElementBounds, setSelectedElementBounds] = useState<SelectedElementBounds | null>(null);

  // Callback to update layout and dimensions
  const updateCanvasDimensions = useCallback(() => {
    if (!fabricCanvas.current) return;
    const container = document.getElementById('preview-container');
    if (!container) return;

    const width = container.clientWidth;
    let height = 0; // Initialize height to 0, will be calculated

    const bgImage = fabricCanvas.current.backgroundImage as fabric.FabricImage;
    if (bgImage?.width && bgImage?.height) {
      const aspectRatio = bgImage.width / bgImage.height;
      height = width / aspectRatio; // Image's aspect ratio
    } else {
      // No image selected, use default 16:9 aspect ratio
      const defaultAspectRatio = 16 / 9;
      height = width / defaultAspectRatio;
      
      // Ensure minimum height from CSS (min-h-[300px])
      const MIN_HEIGHT = 300; 
      if (height < MIN_HEIGHT) {
        height = MIN_HEIGHT;
      }
    }

    fabricCanvas.current.setDimensions({ width, height });
    fabricService.updateLayout(fabricCanvas.current);
  }, []);

  // Initialize Canvas and Resize Observer
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      fabricCanvas.current = new fabric.Canvas(canvasElement, {
        width: canvasElement.clientWidth,
        height: canvasElement.clientHeight,
      });

      (canvasElement as FabricCanvasElement).__fabric = fabricCanvas.current;

      const canvas = fabricCanvas.current;
      const updateSelectedElementBounds = () => {
        const selectedObject = canvas.getActiveObject() ?? lastSelectedObject.current;
        if (!selectedObject) return;

        lastSelectedObject.current = selectedObject;
        selectedObject.setCoords();
        const bounds = selectedObject.getBoundingRect();
        const { left, top, scale } = getImageMetrics(canvas);
        if (!scale) return;

        const nextBounds = {
          x: (bounds.left - left) / scale,
          y: (bounds.top - top) / scale,
          width: bounds.width / scale,
          height: bounds.height / scale,
        };
        fabricService.setEditorBounds(selectedObject, nextBounds, scale);
        setSelectedElementBounds((previous) => (
          previous?.x === nextBounds.x && previous.y === nextBounds.y
            && previous.width === nextBounds.width && previous.height === nextBounds.height
            ? previous
            : nextBounds
        ));
      };
      const unsubscribeSelectionCreated = canvas.on('selection:created', updateSelectedElementBounds);
      const unsubscribeSelectionUpdated = canvas.on('selection:updated', updateSelectedElementBounds);
      const unsubscribeRender = canvas.on('after:render', updateSelectedElementBounds);

      const resizeObserver = new ResizeObserver(() => {
        if (fabricCanvas.current && canvasElement) {
          requestAnimationFrame(() => {
            updateCanvasDimensions();
          });
        }
      });

      const container = document.getElementById('preview-container');
      if (container) {
        resizeObserver.observe(container);
      } else {
        resizeObserver.observe(canvasElement.parentElement ?? canvasElement);
      }

      return () => {
        unsubscribeSelectionCreated();
        unsubscribeSelectionUpdated();
        unsubscribeRender();
        lastSelectedObject.current = null;
        if (canvasElement) {
          delete (canvasElement as FabricCanvasElement).__fabric;
        }
        fabricCanvas.current?.dispose();
        resizeObserver.disconnect();
      };
    }
  }, [canvasRef, updateCanvasDimensions]);

  const updateSelectedElementBounds = (field: keyof SelectedElementBounds, value: number) => {
    const canvas = fabricCanvas.current;
    const object = canvas?.getActiveObject() ?? lastSelectedObject.current;
    if (!canvas || !object || !Number.isFinite(value)) return;
    if ((field === 'width' || field === 'height') && value <= 0) return;
    if (canvas.getActiveObject() !== object && !canvas.getObjects().includes(object)) return;

    object.setCoords();
    const bounds = object.getBoundingRect();
    const { left, top, scale } = getImageMetrics(canvas);
    if (!scale || !bounds.width || !bounds.height) return;
    const target = { ...bounds };
    if (field === 'x') target.left = left + value * scale;
    else if (field === 'y') target.top = top + value * scale;
    else target[field] = value * scale;

    if (field === 'width' || field === 'height') {
      if (object.isType('Textbox')) {
        const objectScale = Math.abs(field === 'width' ? object.scaleX : object.scaleY);
        if (!objectScale) return;
        const stroke = object.strokeUniform ? object.strokeWidth / objectScale : object.strokeWidth;
        object.set(field, Math.max(0, target[field] / objectScale - stroke));
      } else {
        const ratio = target[field] / bounds[field];
        const proportional = object.angle % 180 !== 0 || !!object.group;
        object.set({
          scaleX: object.scaleX * (field === 'width' || proportional ? ratio : 1),
          scaleY: object.scaleY * (field === 'height' || proportional ? ratio : 1),
        });
      }
    }
    object.setCoords();
    const resizedBounds = object.getBoundingRect();
    object.setXY(object.getXY().add(new fabric.Point(
      target.left - resizedBounds.left, target.top - resizedBounds.top
    )));
    object.setCoords();
    const updatedBounds = object.getBoundingRect();
    fabricService.setEditorBounds(object, {
      x: (updatedBounds.left - left) / scale,
      y: (updatedBounds.top - top) / scale,
      width: updatedBounds.width / scale,
      height: updatedBounds.height / scale,
    }, scale);
    lastSelectedObject.current = object;
    canvas.requestRenderAll();
  };

  const updateText = (id: string, text: string) => {
    if (!fabricCanvas.current || !selectedImage) return;
    fabricService.updateText(fabricCanvas.current, selectedImage, id, text);
    // Layout update is now handled within fabricService.updateText for new items,
    // and skipped for existing items to preserve user adjustments.
  };

  const updateCymraegStatus = async (status: 'None' | 'Learner' | 'Fluent') => {
    setCymraegStatus(status);
    if (!fabricCanvas.current || !selectedImage) return;

    await fabricService.updateLogoStatus(fabricCanvas.current, selectedImage.logoConfig, status);
  };

  const loadImage = useCallback(async (
    image: BackgroundImage,
    textValues: Record<string, string>,
    status: 'None' | 'Learner' | 'Fluent'
  ) => {
    const editableImage = {
      ...image,
      placeholders: image.placeholders.map((placeholder) => ({ ...placeholder })),
      ...(image.logoConfig ? { logoConfig: { ...image.logoConfig } } : {}),
    };
    setSelectedImage(editableImage);
    if (!fabricCanvas.current) return;

    try {
      setImageLoadingError(null);
      lastSelectedObject.current = null;
      setSelectedElementBounds(null);
      fabricCanvas.current.clear();

      const img = await fabric.FabricImage.fromURL(image.src, { crossOrigin: 'anonymous' });
      
      if (!fabricCanvas.current) return;

      const canvas = fabricCanvas.current;
      canvas.backgroundImage = img;

      setOriginalImageDimensions({ width: img.width, height: img.height });
      
      updateCanvasDimensions();

      // Re-add text
      Object.entries(textValues).forEach(([id, text]) => {
        fabricService.updateText(canvas, editableImage, id, text);
      });

      // Re-add logo
      if (status !== 'None' && editableImage.logoConfig) {
        await fabricService.addLogo(canvas, editableImage.logoConfig, status);
      }

      updateCanvasDimensions();
      
    } catch (error) {
      console.error('Error loading image:', error);
      setImageLoadingError(`Failed to load image: ${image.name}. Please try a different image.`);
    }
  }, [updateCanvasDimensions]);

  useEffect(() => {
    if (!restoredState?.image) return;
    const image = restoredState.image;
    const frame = requestAnimationFrame(() => {
      void loadImage(image, restoredState.textValues, restoredState.cymraegStatus);
    });
    return () => cancelAnimationFrame(frame);
  }, [restoredState, loadImage]);

  const selectImage = (image: BackgroundImage, textValues: Record<string, string> = {}) =>
    loadImage(image, textValues, cymraegStatus);

  const downloadImage = async () => {
    if (!selectedImage || !originalImageDimensions || !fabricCanvas.current) {
      console.error('No image selected or original dimensions not available for download.');
      return;
    }

    try {
      const tempCanvas = await fabricService.generateDownloadCanvas(
        selectedImage,
        originalImageDimensions,
        fabricCanvas.current.getObjects(),
        cymraegStatus
      );

      const dataURL = tempCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      const link = document.createElement('a');
      link.href = dataURL;
      
      // Extract filename from src path (e.g., "/images/bg.png" -> "bg.png")
      const srcPath = selectedImage.src;
      const fileNameWithExt = srcPath.substring(srcPath.lastIndexOf('/') + 1);
      
      const lastDotIndex = fileNameWithExt.lastIndexOf('.');
      let baseName = fileNameWithExt;
      let extension = '';

      if (lastDotIndex !== -1) {
        baseName = fileNameWithExt.substring(0, lastDotIndex);
        extension = fileNameWithExt.substring(lastDotIndex);
      }
      const downloadFileName = `${baseName}-Personalised${extension || '.png'}`;

      link.download = downloadFileName;
      link.click();
      
      tempCanvas.dispose();
    } catch (error) {
      console.error('Error generating image for download:', error);
    }
  };

  return { selectImage, updateText, downloadImage, imageLoadingError, updateCymraegStatus, cymraegStatus, selectedElementBounds, updateSelectedElementBounds };
};