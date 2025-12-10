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

  // Callback to update layout when canvas resizes
  const updateLayout = useCallback(() => {
    if (fabricCanvas.current) {
      fabricService.updateLayout(fabricCanvas.current);
    }
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
            if (!fabricCanvas.current || !canvasElement) return;

            const container = document.getElementById('preview-container');
            if (!container) return;

            fabricCanvas.current.setDimensions({
              width: container.clientWidth,
              height: container.clientHeight,
            });

            updateLayout();
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
  }, [canvasRef, updateLayout]);

  const updateText = (id: string, text: string) => {
    if (!fabricCanvas.current || !selectedImage) return;
    fabricService.updateText(fabricCanvas.current, selectedImage, id, text);
    updateLayout();
  };

  const updateCymraegStatus = async (status: 'None' | 'Learner' | 'Fluent') => {
    setCymraegStatus(status);
    if (!fabricCanvas.current || !selectedImage) return;

    fabricService.removeLogo(fabricCanvas.current);

    if (status !== 'None' && selectedImage.logoConfig) {
      await fabricService.addLogo(fabricCanvas.current, selectedImage.logoConfig, status);
      updateLayout();
    } else {
      fabricCanvas.current.requestRenderAll();
    }
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
      
      updateLayout();

      // Re-add text
      Object.entries(textValues).forEach(([id, text]) => {
        fabricService.updateText(canvas, image, id, text);
      });

      // Re-add logo
      if (cymraegStatus !== 'None' && image.logoConfig) {
        await fabricService.addLogo(canvas, image.logoConfig, cymraegStatus);
      }

      updateLayout();
      
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
      link.download = 'virtual-background.png';
      link.click();
      
      tempCanvas.dispose();
    } catch (error) {
      console.error('Error generating image for download:', error);
    }
  };

  return { selectImage, updateText, downloadImage, imageLoadingError, updateCymraegStatus, cymraegStatus };
};