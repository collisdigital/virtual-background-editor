import * as fabric from 'fabric';
import { BackgroundImage, LogoConfig, Placeholder } from '../config/backgrounds';

interface FabricObjectWithConfig extends fabric.Object {
  _placeholder?: Placeholder;
  _logoConfig?: LogoConfig;
  name?: string;
}

interface LayoutMetrics {
  scale: number;
  imgLeft: number;
  imgTop: number;
}

const getLayoutMetrics = (canvas: fabric.Canvas) => {
  if (!canvas.backgroundImage) return null;
  const bgImage = canvas.backgroundImage as fabric.FabricImage;
  if (!bgImage.width || !bgImage.height) return null;

  const scale = Math.min(
    (canvas.width ?? 0) / bgImage.width,
    (canvas.height ?? 0) / bgImage.height
  );

  const imgLeft = (canvas.width ?? 0) / 2 - (bgImage.width * scale) / 2;
  const imgTop = (canvas.height ?? 0) / 2 - (bgImage.height * scale) / 2;

  return { scale, imgLeft, imgTop };
};

const positionPlaceholderObject = (obj: fabric.Object, placeholder: Placeholder, metrics: LayoutMetrics) => {
  obj.set({
    left: metrics.imgLeft + placeholder.x * metrics.scale,
    top: metrics.imgTop + placeholder.y * metrics.scale,
    width: placeholder.width * metrics.scale,
    fontSize: placeholder.fontSize * metrics.scale,
    scaleX: 1,
    scaleY: 1,
  });
  obj.setCoords();
};

const positionLogoObjects = (logoObj: fabric.Object | undefined, textObj: fabric.Object | undefined, config: LogoConfig, metrics: LayoutMetrics) => {
  if (logoObj?.width) {
    const logoScale = (config.width * metrics.scale) / logoObj.width;
    logoObj.set({
      left: metrics.imgLeft + config.x * metrics.scale,
      top: metrics.imgTop + config.y * metrics.scale,
      scaleX: logoScale,
      scaleY: logoScale,
    });
    logoObj.setCoords();
  }

  if (textObj) {
    const xOffset = config.textXOffset * metrics.scale;
    const yOffset = config.textYOffset * metrics.scale;
    const baseFontSize = config.fontSize;
    textObj.set({
      left: metrics.imgLeft + (config.x + config.width) * metrics.scale + xOffset,
      top: metrics.imgTop + config.y * metrics.scale + yOffset,
      fontSize: baseFontSize * metrics.scale,
      width: 50 * metrics.scale,
      scaleX: 1,
      scaleY: 1,
    });
    textObj.setCoords();
  }
};

export const fabricService = {
  /**
   * Calculates the layout for the background image and positions all objects relative to it.
   */
  updateLayout: (canvas: fabric.Canvas) => {
    if (!canvas.backgroundImage) return;

    const bgImage = canvas.backgroundImage as fabric.FabricImage;
    if (!bgImage.width || !bgImage.height) return;

    const metrics = getLayoutMetrics(canvas);
    if (!metrics) return;

    // Center Image
    bgImage.set({
      scaleX: metrics.scale,
      scaleY: metrics.scale,
      left: (canvas.width ?? 0) / 2,
      top: (canvas.height ?? 0) / 2,
      originX: 'center',
      originY: 'center',
    });

    // Update Objects (Text and Logo)
    const objects = canvas.getObjects() as FabricObjectWithConfig[];
    
    // Group logo objects
    const logoObj = objects.find(o => o.name === 'cymraeg-logo');
    const logoTextObj = objects.find(o => o.name === 'cymraeg-text');

    objects.forEach((obj) => {
      if (obj._placeholder) {
        positionPlaceholderObject(obj, obj._placeholder, metrics);
      }
    });

    // Update logo pair if they exist and have config attached (they should)
    if (logoObj?._logoConfig) {
      positionLogoObjects(logoObj, logoTextObj, logoObj._logoConfig, metrics);
    }
    
    canvas.requestRenderAll();
  },

  /**
   * Adds or updates a text object on the canvas.
   */
  updateText: (canvas: fabric.Canvas, selectedImage: BackgroundImage, id: string, text: string) => {
    const placeholder = selectedImage.placeholders.find((p) => p.id === id);
    if (!placeholder) return;

    // Check for existing text object
    const existingObject = canvas.getObjects().find(o => o.name === id) as fabric.Textbox | undefined;

    if (existingObject) {
      existingObject.set({ text });
      canvas.requestRenderAll();
      return;
    }

    // Create new text object
    const textObject = new fabric.Textbox(text, {
      fontFamily: placeholder.font,
      fontSize: placeholder.fontSize,
      fill: placeholder.fill,
      textAlign: placeholder.textAlign,
      name: id,
    });

    (textObject as FabricObjectWithConfig)._placeholder = placeholder;
    canvas.add(textObject);
    
    // Position the new object correctly
    const metrics = getLayoutMetrics(canvas);
    if (metrics) {
        positionPlaceholderObject(textObject, placeholder, metrics);
        canvas.requestRenderAll();
    }
  },

  /**
   * Updates the Cymraeg logo text status without removing/re-adding if possible.
   */
  updateLogoStatus: async (
    canvas: fabric.Canvas,
    logoConfig: LogoConfig | undefined,
    status: 'None' | 'Learner' | 'Fluent'
  ) => {
      if (!logoConfig) return;

      if (status === 'None') {
          fabricService.removeLogo(canvas);
          return;
      }

      const existingLogo = canvas.getObjects().find(o => o.name === 'cymraeg-logo');                                                                                                                               
      const existingText = canvas.getObjects().find(o => o.name === 'cymraeg-text');

      if (existingLogo && existingText) {
          // Update existing text
          const textContent = status === 'Learner' ? "Dysgwyr\nLearner" : "Rhugl\nFluent";
          existingText.set({ text: textContent });
          canvas.requestRenderAll();
      } else {
          // Clean up potential partial state or existing objects that weren't a complete pair
          fabricService.removeLogo(canvas);
          
          // Add new
          await fabricService.addLogo(canvas, logoConfig, status);
          
          // Position newly added logo
          const metrics = getLayoutMetrics(canvas);
          if (metrics) {
             const newLogo = canvas.getObjects().find(o => o.name === 'cymraeg-logo');
             const newText = canvas.getObjects().find(o => o.name === 'cymraeg-text');
             positionLogoObjects(newLogo, newText, logoConfig, metrics);
             canvas.requestRenderAll();
          }
      }
  },

  /**
   * Adds the Cymraeg logo and text to the canvas.
   */
  addLogo: async (
    canvas: fabric.Canvas,
    logoConfig: LogoConfig,
    status: 'Learner' | 'Fluent'
  ) => {
    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : import.meta.env.BASE_URL + '/';
    const logoUrl = `${baseUrl}images/overlays/logo-cymraeg.png`;

    try {
      const logoImg = await fabric.FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' });

      logoImg.set({
        name: 'cymraeg-logo',
        originX: 'left',
        originY: 'top',
      });
      (logoImg as FabricObjectWithConfig)._logoConfig = logoConfig;
      canvas.add(logoImg);

      const textContent = status === 'Learner' ? "Dysgwyr\nLearner" : "Rhugl\nFluent";
      const textObj = new fabric.Textbox(textContent, {
        name: 'cymraeg-text',
        fontFamily: logoConfig.font,
        fill: logoConfig.fill,
        textAlign: logoConfig.textAlign as 'left' | 'center' | 'right' | 'justify',
        originX: 'left',
        originY: 'top',
        width: 50,
        lineHeight: 1.1,
      });
      (textObj as FabricObjectWithConfig)._logoConfig = logoConfig;
      canvas.add(textObj);
    } catch (e) {
      console.error('Failed to load logo', e);
    }
  },

  /**
   * Removes the Cymraeg logo and text from the canvas.
   */
  removeLogo: (canvas: fabric.Canvas) => {
    const existingLogo = canvas.getObjects().find(o => o.name === 'cymraeg-logo');
    const existingText = canvas.getObjects().find(o => o.name === 'cymraeg-text');

    if (existingLogo) canvas.remove(existingLogo);
    if (existingText) canvas.remove(existingText);
  },

  /**
   * Creates a high-resolution export of the canvas.
   */
  generateDownloadCanvas: async (
    selectedImage: BackgroundImage,
    originalDimensions: { width: number; height: number },
    interactiveObjects: fabric.Object[],
    cymraegStatus: 'None' | 'Learner' | 'Fluent'
  ): Promise<fabric.StaticCanvas> => {
    const tempCanvasEl = document.createElement('canvas');
    const tempCanvas = new fabric.StaticCanvas(tempCanvasEl, {
      width: originalDimensions.width,
      height: originalDimensions.height,
      renderOnAddRemove: false,
    });

    // Load background
    const originalImg = await fabric.FabricImage.fromURL(selectedImage.src, {
      crossOrigin: 'anonymous',
    });
    tempCanvas.backgroundImage = originalImg;

    // Add Text Objects
    interactiveObjects.forEach((obj) => {
      const fabricObj = obj as FabricObjectWithConfig;
      if (fabricObj._placeholder) {
        const placeholder = fabricObj._placeholder;
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

    // Add Logo
    if (cymraegStatus !== 'None' && selectedImage.logoConfig) {
      const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : import.meta.env.BASE_URL + '/';
      const logoUrl = `${baseUrl}images/overlays/logo-cymraeg.png`;
      const logoImg = await fabric.FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' });
      const config = selectedImage.logoConfig;

      logoImg.set({
        left: config.x,
        top: config.y,
        scaleX: config.width / logoImg.width!,
        scaleY: config.width / logoImg.width!,
        originX: 'left',
        originY: 'top',
      });
      tempCanvas.add(logoImg);

      const textContent = cymraegStatus === 'Learner' ? "Dysgwyr\nLearner" : "Rhugl\nFluent";
      const baseFontSize = config.fontSize;

      const textObj = new fabric.Textbox(textContent, {
        fontFamily: config.font,
        fontSize: baseFontSize,
        fill: config.fill,
        textAlign: config.textAlign as 'left' | 'center' | 'right' | 'justify',
        left: config.x + config.width + config.textXOffset,
        top: config.y + config.textYOffset,
        originX: 'left',
        originY: 'top',
        width: 50,
        lineHeight: 1.1,
      });
      tempCanvas.add(textObj);
    }

    tempCanvas.renderAll();
    return tempCanvas;
  },
};