import { BackgroundImage, createPlaceholders, createLogoConfig } from '../config/backgrounds';
import { useState, useRef, ChangeEvent } from 'react';

interface ImageSelectorProps {
  backgrounds: BackgroundImage[];
  onSelect: (image: BackgroundImage) => void;
  initialSelectedId?: string | null;
}

const ImageSelector = ({ backgrounds, onSelect, initialSelectedId = null }: ImageSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (bg: BackgroundImage) => {
    setSelectedId(bg.id);
    onSelect(bg);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const newBackground: BackgroundImage = {
      id: `user-upload-${Date.now()}`,
      name: file.name,
      src: objectUrl,
      // Place in top-left corner, user can drag them to the best position
      placeholders: createPlaceholders(0, 0, 0, 0),
      logoConfig: createLogoConfig(0, 0),
    };

    setCustomBackgrounds((prev) => [newBackground, ...prev]);
    handleSelect(newBackground);
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const allBackgrounds = [...customBackgrounds, ...backgrounds];

  // Check for debug mode to enable custom uploads
  const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Background</h3>
      {isDebug && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
          data-testid="file-upload"
        />
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {isDebug && (
          <button
            onClick={triggerFileUpload}
            className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Upload custom background"
          >
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Add New</span>
          </button>
        )}

        {allBackgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => handleSelect(bg)}
            className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              selectedId === bg.id
                ? 'border-blue-600 shadow-md scale-[1.02]'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-label={`Select ${bg.name} as background`}
            aria-pressed={selectedId === bg.id}
            title={bg.name}
            data-testid={`bg-select-${bg.id}`}
          >
            <img
              src={bg.src}
              alt={bg.name}
              className="w-full h-full object-cover"
            />
            {selectedId === bg.id && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageSelector;
