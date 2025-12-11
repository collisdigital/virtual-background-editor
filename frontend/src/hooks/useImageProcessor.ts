import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { BackgroundImage } from '../config/backgrounds';
import { fabricService } from '../services/fabricService';

interface FabricCanvasElement extends HTMLCanvasElement {
  __fabric?: fabric.Canvas;
}

export const useImageProcessor = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedImage, setSelectedImage] = useState<BackgroundImage | null>(
    null
  );
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageLoadingError, setImageLoadingError] = useState<string | null>(null);
  const [cymraegStatus, setCymraegStatus] = useState<'None' | 'Learner' | 'Fluent'>('None');

  // Callback to update layout and dimensions
  const updateCanvasDimensions = useCallback(() => {
    if (!fabricCanvas.current) return;
    const container = document.getElementById('preview-container');
    if (!container) return;

    const width = container.clientWidth;
    let height = 0; // Initialize height to 0, will be calculated

    const bgImage = fabricCanvas.current.backgroundImage as fabric.FabricImage;
    if (bgImage && bgImage.width && bgImage.height) {
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
        if (canvasElement) {
          delete (canvasElement as FabricCanvasElement).__fabric;
        }
        fabricCanvas.current?.dispose();
        resizeObserver.disconnect();
      };
    }
  }, [canvasRef, updateCanvasDimensions]);

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

  const selectImage = async (image: BackgroundImage, textValues: Record<string, string> = {}) => {
    setSelectedImage(image);
    if (!fabricCanvas.current) return;

    try {
      setImageLoadingError(null);
      fabricCanvas.current.clear();

      const img = await fabric.FabricImage.fromURL(image.src, { crossOrigin: 'anonymous' });
      
      if (!fabricCanvas.current) return;

      const canvas = fabricCanvas.current;
      canvas.backgroundImage = img;

      setOriginalImageDimensions({ width: img.width, height: img.height });
      
      updateCanvasDimensions();

      // Re-add text
      Object.entries(textValues).forEach(([id, text]) => {
        fabricService.updateText(canvas, image, id, text);
      });

      // Re-add logo
      if (cymraegStatus !== 'None' && image.logoConfig) {
        await fabricService.addLogo(canvas, image.logoConfig, cymraegStatus);
      }

      updateCanvasDimensions();
      
    } catch (error) {
      console.error('Error loading image:', error);
      setImageLoadingError(`Failed to load image: ${image.name}. Please try a different image.`);
    }
  };

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

  return { selectImage, updateText, downloadImage, imageLoadingError, updateCymraegStatus, cymraegStatus };
};