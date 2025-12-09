import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { BackgroundImage } from '../config/backgrounds';

export const useImageProcessor = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedImage, setSelectedImage] = useState<BackgroundImage | null>(
    null
  );
  const [imageLoadingError, setImageLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight,
      });

      const resizeObserver = new ResizeObserver(() => {
        if (fabricCanvas.current && canvasRef.current) {
          fabricCanvas.current.setDimensions({
            width: canvasRef.current.clientWidth,
            height: canvasRef.current.clientHeight,
          });
          if (fabricCanvas.current.backgroundImage) {
            const img = fabricCanvas.current.backgroundImage;
            const canvas = fabricCanvas.current;
            const scaleX = (canvas.width ?? 0) / (img.width ?? 1);
            const scaleY = (canvas.height ?? 0) / (img.height ?? 1);
            img.set({
              scaleX: scaleX,
              scaleY: scaleY,
            });
          }
          fabricCanvas.current.renderAll();
        }
      });

      resizeObserver.observe(canvasRef.current);

      return () => {
        fabricCanvas.current?.dispose();
        resizeObserver.disconnect();
      };
    }
  }, [canvasRef]);

  const updateText = (id: string, text: string) => {
    if (!fabricCanvas.current || !selectedImage) return;

    const placeholder = selectedImage.placeholders.find((p) => p.id === id);
    if (!placeholder) return;

    // Remove existing text object if it exists
    const existingObject = fabricCanvas.current
      .getObjects()
      .find((obj) => (obj as fabric.Object & { name?: string }).name === id);
    if (existingObject) {
      fabricCanvas.current.remove(existingObject);
    }

    const textObject = new fabric.Textbox(text, {
      left: placeholder.x,
      top: placeholder.y,
      width: placeholder.width,
      fontFamily: placeholder.font,
      fontSize: placeholder.fontSize,
      fill: placeholder.fill,
      textAlign: placeholder.textAlign,
      name: id,
    });

    fabricCanvas.current.add(textObject);
    fabricCanvas.current.renderAll();
  };

  const selectImage = async (image: BackgroundImage) => {
    setSelectedImage(image);
    setImageLoadingError(null); // Clear previous errors
    if (!fabricCanvas.current) return;

    try {
      const img = await fabric.FabricImage.fromURL(image.src, { crossOrigin: 'anonymous' });
      
      if (!fabricCanvas.current) return;

      const canvas = fabricCanvas.current;
      const scaleX = (canvas.width ?? 0) / (img.width ?? 1);
      const scaleY = (canvas.height ?? 0) / (img.height ?? 1);

      img.scaleX = scaleX;
      img.scaleY = scaleY;

      canvas.backgroundImage = img;
      canvas.requestRenderAll();
      
    } catch (error) {
      console.error('Error loading image:', error);
      setImageLoadingError(`Failed to load image: ${image.name}. Please try a different image.`);
    }
  };

  const downloadImage = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'virtual-background.png';
      link.click();
    }
  };

  return { selectImage, updateText, downloadImage, imageLoadingError };
};
