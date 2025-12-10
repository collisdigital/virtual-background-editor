import { BackgroundImage } from '../config/backgrounds';
import { useState } from 'react';

interface ImageSelectorProps {
  backgrounds: BackgroundImage[];
  onSelect: (image: BackgroundImage) => void;
}

const ImageSelector = ({ backgrounds, onSelect }: ImageSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (bg: BackgroundImage) => {
    setSelectedId(bg.id);
    onSelect(bg);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Background</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {backgrounds.map((bg) => (
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
