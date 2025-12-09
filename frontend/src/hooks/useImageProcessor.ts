import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { BackgroundImage, Placeholder } from '../config/backgrounds';

interface FabricObjectWithPlaceholder extends fabric.Object {
  _placeholder?: Placeholder;
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

  const updateLayout = useCallback(() => {
    if (!fabricCanvas.current?.backgroundImage) return;

    const canvas = fabricCanvas.current;
    const bgImage = canvas.backgroundImage as fabric.FabricImage;

    if (!bgImage.width || !bgImage.height) return;

    // Calculate Scale (Contain) - Ensure image is fully visible
    const scale = Math.min(
      (canvas.width ?? 0) / bgImage.width,
      (canvas.height ?? 0) / bgImage.height
    );

    // Center Image
    bgImage.set({
      scaleX: scale,
      scaleY: scale,
      left: (canvas.width ?? 0) / 2,
      top: (canvas.height ?? 0) / 2,
      originX: 'center',
      originY: 'center',
    });

    // Calculate Top-Left of the image relative to canvas
    // imageCenter is at canvas.width/2, canvas.height/2
    const imgLeft = (canvas.width ?? 0) / 2 - (bgImage.width * scale) / 2;
    const imgTop = (canvas.height ?? 0) / 2 - (bgImage.height * scale) / 2;

    // Update Text Objects
    canvas.getObjects().forEach((obj) => {
      // Find the placeholder config for this text object
      // We assume selectedImage is current because objects are cleared on image selection?
      // Actually we need to access the current selectedImage state. 
      // But we can't easily access state inside this callback if it's stale.
      // We can attach the original placeholder config to the object itself!
      const placeholder = (obj as FabricObjectWithPlaceholder)._placeholder;
      if (placeholder) {
        // Reset scale to 1 and calculate properties directly for the current canvas scale
        // This ensures wrapping (width) and font size behave consistently without transform artifacts
        obj.set({
          left: imgLeft + placeholder.x * scale,
          top: imgTop + placeholder.y * scale,
          width: placeholder.width * scale,
          fontSize: placeholder.fontSize * scale,
          scaleX: 1,
          scaleY: 1,
        });
        obj.setCoords();
      }
    });

    canvas.requestRenderAll();
  }, []); // We might need to depend on selectedImage if we used it, but attaching _placeholder is safer.

  useEffect(() => {
    if (canvasRef.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight,
      });

      const resizeObserver = new ResizeObserver(() => {
        if (fabricCanvas.current && canvasRef.current) {
          requestAnimationFrame(() => {
            if (!fabricCanvas.current || !canvasRef.current) return;

            // Find the responsive container by ID
            const container = document.getElementById('preview-container');
            if (!container) return;

            const width = container.clientWidth;
            const height = container.clientHeight;

            fabricCanvas.current.setDimensions({
              width: width,
              height: height,
            });

            updateLayout();
          });
        }
      });

      // Observe the responsive container
      const container = document.getElementById('preview-container');
      if (container) {
        resizeObserver.observe(container);
      } else {
        // Fallback if ID isn't found immediately (though it should be)
        resizeObserver.observe(canvasRef.current.parentElement ?? canvasRef.current);
      }

      return () => {
        fabricCanvas.current?.dispose();
        resizeObserver.disconnect();
      };
    }
  }, [canvasRef, updateLayout]);

  const updateText = (id: string, text: string) => {
    if (!fabricCanvas.current || !selectedImage) return;

    const placeholder = selectedImage.placeholders.find((p) => p.id === id);
    if (!placeholder) return;

    const canvas = fabricCanvas.current;

    // Remove existing text object if it exists
    const existingObject = canvas
      .getObjects()
      .find((obj) => (obj as fabric.Object & { name?: string }).name === id);
    if (existingObject) {
      canvas.remove(existingObject);
    }

    // We create the text object initially. 
    // We need to calculate its initial position correctly.
    // We can reuse updateLayout logic or just force an update.
    
    // Create text object with temporary coordinates
    const textObject = new fabric.Textbox(text, {
      fontFamily: placeholder.font,
      fontSize: placeholder.fontSize,
      fill: placeholder.fill,
      textAlign: placeholder.textAlign,
      name: id,
    });
    
    // Attach placeholder config to the object for future updates
    (textObject as FabricObjectWithPlaceholder)._placeholder = placeholder;

    canvas.add(textObject);
    
    // Position it correctly immediately
    updateLayout();
  };

  const selectImage = async (image: BackgroundImage, textValues: Record<string, string> = {}) => {
                      setSelectedImage(image);    if (!fabricCanvas.current) return;

    try {
      // Clear existing objects (text) when changing background
      setImageLoadingError(null);
      fabricCanvas.current.clear();
      
      const img = await fabric.FabricImage.fromURL(image.src, { crossOrigin: 'anonymous' });
      
      if (!fabricCanvas.current) return;

      const canvas = fabricCanvas.current;
      
      canvas.backgroundImage = img;

      setOriginalImageDimensions({ width: img.width, height: img.height });
      setSelectedImage(image);
      
      updateLayout();

      // Re-add text objects if values are provided
      Object.entries(textValues).forEach(([id, text]) => {
        // We need to use the NEW selectedImage context, but state update is async.
        // So we must rely on the 'image' argument passed to this function, not 'selectedImage' state.
        const placeholder = image.placeholders.find((p) => p.id === id);
        if (!placeholder) return;

        const textObject = new fabric.Textbox(text, {
          fontFamily: placeholder.font,
          fontSize: placeholder.fontSize,
          fill: placeholder.fill,
          textAlign: placeholder.textAlign,
          name: id,
        });
        
        (textObject as FabricObjectWithPlaceholder)._placeholder = placeholder;
        canvas.add(textObject);
      });

      // Layout again to position new text objects correctly
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

    // Create a temporary static canvas with original image dimensions
    const tempCanvas = new fabric.StaticCanvas(null, {
      width: originalImageDimensions.width,
      height: originalImageDimensions.height,
      renderOnAddRemove: false, // Optimize for static rendering
    });

    try {
      // Load the background image onto the temporary canvas
      const originalImg = await fabric.FabricImage.fromURL(selectedImage.src, { crossOrigin: 'anonymous' });
      tempCanvas.backgroundImage = originalImg;

      // Add all text objects from the interactive canvas to the temporary canvas
      fabricCanvas.current.getObjects().forEach((obj) => {
        const placeholder = (obj as FabricObjectWithPlaceholder)._placeholder;
        if (placeholder) {
          const textObject = new fabric.Textbox((obj as fabric.Textbox).text ?? '', {
            fontFamily: placeholder.font,
            fontSize: placeholder.fontSize,
            fill: placeholder.fill,
            textAlign: placeholder.textAlign,
            left: placeholder.x,
            top: placeholder.y,
            width: placeholder.width,
            originX: 'left',
            originY: 'top',
          });
          tempCanvas.add(textObject);
        }
      });
      
      // Render all objects on the temporary canvas
      tempCanvas.renderAll();

      // Generate data URL and trigger download
      const dataURL = tempCanvas.toDataURL({
        format: 'png',
        quality: 1, // Max quality
      });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'virtual-background.png';
      link.click();
    } catch (error) {
      console.error('Error generating image for download:', error);
    } finally {
      // Dispose the temporary canvas to free up memory
      tempCanvas.dispose();
    }
  };

  return { selectImage, updateText, downloadImage, imageLoadingError };
};
