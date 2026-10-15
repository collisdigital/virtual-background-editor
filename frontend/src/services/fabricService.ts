import * as fabric from 'fabric';
import { BackgroundImage, LogoConfig, Placeholder } from '../config/backgrounds';

interface FabricObjectWithConfig extends fabric.Object {
  _placeholder?: Placeholder;
  _logoConfig?: LogoConfig;
  _editorBounds?: { x: number; y: number; width: number; height: number; fontSize?: number };
  name?: string;
}

interface LayoutMetrics {
  scale: number;
  imgLeft: number;
  imgTop: number;
}

interface EditorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
}

const createTextBoxControls = () => {
  const controls = fabric.controlsUtils.createTextboxDefaultControls();
  for (const [key, control] of Object.entries(controls)) {
    if (key === 'mtr') continue;
    control.actionName = 'resizing';
    control.getActionName = () => 'resizing';
    control.actionHandler = (event, transform, x, y) => {
      const widthChanged = control.x !== 0
        && fabric.controlsUtils.changeWidth(event, transform, x, y);
      const heightChanged = control.y !== 0
        && fabric.controlsUtils.changeHeight(event, transform, x, y);
      return widthChanged || heightChanged;
    };
  }
  return controls;
};

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

const positionPlaceholderObject = (obj: FabricObjectWithConfig, placeholder: Placeholder, metrics: LayoutMetrics) => {
  const bounds = obj._editorBounds;
  obj.set({
    left: metrics.imgLeft + (bounds?.x ?? placeholder.x) * metrics.scale,
    top: metrics.imgTop + (bounds?.y ?? placeholder.y) * metrics.scale,
    width: (bounds?.width ?? placeholder.width) * metrics.scale,
    fontSize: (bounds?.fontSize ?? placeholder.fontSize) * metrics.scale,
    scaleX: 1,
    scaleY: 1,
    originX: 'left',
    originY: 'top',
  });
  if (bounds && obj.height) {
    obj.setCoords();
    const naturalHeight = obj.getBoundingRect().height;
    if (naturalHeight) obj.set('scaleY', (bounds.height * metrics.scale) / naturalHeight);
  }
  obj.setCoords();
};

const positionLogoObjects = (logoObj: FabricObjectWithConfig | undefined, textObj: FabricObjectWithConfig | undefined, config: LogoConfig, metrics: LayoutMetrics) => {
  if (logoObj?.width) {
    const bounds = logoObj._editorBounds;
    const logoScaleX = ((bounds?.width ?? config.width) * metrics.scale) / logoObj.width;
    const logoScaleY = ((bounds?.height ?? config.width) * metrics.scale) / logoObj.height!;
    logoObj.set({
      left: metrics.imgLeft + (bounds?.x ?? config.x) * metrics.scale,
      top: metrics.imgTop + (bounds?.y ?? config.y) * metrics.scale,
      scaleX: logoScaleX,
      scaleY: logoScaleY,
    });
    logoObj.setCoords();
  }

  if (textObj) {
    const bounds = textObj._editorBounds;
    const baseFontSize = config.fontSize;
    textObj.set({
      left: metrics.imgLeft + (bounds?.x ?? config.x + config.width + config.textXOffset) * metrics.scale,
      top: metrics.imgTop + (bounds?.y ?? config.y + config.textYOffset) * metrics.scale,
      fontSize: (bounds?.fontSize ?? baseFontSize) * metrics.scale,
      width: (bounds?.width ?? 50) * metrics.scale,
      scaleX: 1,
      scaleY: 1,
    });
    if (bounds && textObj.height) {
      textObj.setCoords();
      const naturalHeight = textObj.getBoundingRect().height;
      if (naturalHeight) textObj.set('scaleY', (bounds.height * metrics.scale) / naturalHeight);
    }
    textObj.setCoords();
  }
};

export const fabricService = {
  setEditorBounds: (object: fabric.FabricObject, bounds: Omit<EditorBounds, 'fontSize'>, scale: number) => {
    const editableObject = object as FabricObjectWithConfig;
    editableObject._editorBounds = {
      ...bounds,
      ...('fontSize' in object && typeof object.fontSize === 'number'
        ? { fontSize: object.fontSize / scale }
        : {}),
    };
  },

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
    const existingObject = canvas.getObjects().find(o => (o as FabricObjectWithConfig).name === id) as fabric.Textbox | undefined;

    if (existingObject) {
      existingObject.set({ text });
      canvas.requestRenderAll();
      return;
    }

    // Create new text object
    const textObject = new fabric.Textbox(text, {
      controls: createTextBoxControls(),
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

      const { existingLogo, existingText } = findLogoObjects(canvas);

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
             const { existingLogo, existingText } = findLogoObjects(canvas);
             positionLogoObjects(existingLogo, existingText, logoConfig, metrics);
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
        controls: createTextBoxControls(),
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
    const { existingLogo, existingText } = findLogoObjects(canvas);

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
    originalImg.set({
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
    });
    tempCanvas.backgroundImage = originalImg;

    // Add Text Objects
    interactiveObjects.forEach((obj) => {
      const fabricObj = obj as FabricObjectWithConfig;
      if (fabricObj._placeholder) {
        const placeholder = fabricObj._placeholder;
        const bounds = fabricObj._editorBounds;
        const textObject = new fabric.Textbox((obj as fabric.Textbox).text ?? '', {
          fontFamily: placeholder.font,
          fontSize: bounds?.fontSize ?? placeholder.fontSize,
          fill: placeholder.fill,
          textAlign: placeholder.textAlign,
          left: bounds?.x ?? placeholder.x,
          top: bounds?.y ?? placeholder.y,
          width: bounds?.width ?? placeholder.width,
          originX: 'left',
          originY: 'top',
        });
        if (bounds && textObject.height) {
          textObject.setCoords();
          const naturalHeight = textObject.getBoundingRect().height;
          if (naturalHeight) textObject.set('scaleY', bounds.height / naturalHeight);
        }
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
      const logoObject = interactiveObjects.find((obj) => (obj as FabricObjectWithConfig).name === 'cymraeg-logo') as FabricObjectWithConfig | undefined;
      const logoBounds = logoObject?._editorBounds;

      logoImg.set({
        left: logoBounds?.x ?? config.x,
        top: logoBounds?.y ?? config.y,
        scaleX: (logoBounds?.width ?? config.width) / logoImg.width!,
        scaleY: (logoBounds?.height ?? config.width) / logoImg.height!,
        originX: 'left',
        originY: 'top',
      });
      tempCanvas.add(logoImg);

      const textContent = cymraegStatus === 'Learner' ? "Dysgwyr\nLearner" : "Rhugl\nFluent";
      const baseFontSize = config.fontSize;
      const logoText = interactiveObjects.find((obj) => (obj as FabricObjectWithConfig).name === 'cymraeg-text') as FabricObjectWithConfig | undefined;
      const textBounds = logoText?._editorBounds;

      const textObj = new fabric.Textbox(textContent, {
        fontFamily: config.font,
        fontSize: textBounds?.fontSize ?? baseFontSize,
        fill: config.fill,
        textAlign: config.textAlign as 'left' | 'center' | 'right' | 'justify',
        left: textBounds?.x ?? config.x + config.width + config.textXOffset,
        top: textBounds?.y ?? config.y + config.textYOffset,
        originX: 'left',
        originY: 'top',
        width: textBounds?.width ?? 50,
        lineHeight: 1.1,
      });
      if (textBounds && textObj.height) {
        textObj.setCoords();
        const naturalHeight = textObj.getBoundingRect().height;
        if (naturalHeight) textObj.set('scaleY', textBounds.height / naturalHeight);
      }
      tempCanvas.add(textObj);
    }

    tempCanvas.renderAll();
    return tempCanvas;
  },
};

function findLogoObjects(canvas: fabric.Canvas) {
  const existingLogo = canvas.getObjects().find((o) => (o as FabricObjectWithConfig).name === 'cymraeg-logo');
  const existingText = canvas.getObjects().find((o) => (o as FabricObjectWithConfig).name === 'cymraeg-text');
  return { existingLogo, existingText };
}
