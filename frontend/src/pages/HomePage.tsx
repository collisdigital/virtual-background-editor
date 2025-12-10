import { useState, useRef, useMemo } from 'react';
import PreviewCanvas from '../components/PreviewCanvas';
import ControlPanel from '../components/ControlPanel';
import { backgrounds } from '../config/backgrounds';
import { useImageProcessor } from '../hooks/useImageProcessor';

const HomePage = () => {
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectImage, updateText, downloadImage, imageLoadingError, updateCymraegStatus, cymraegStatus } = useImageProcessor(canvasRef);

  const backgroundsWithBaseUrl = useMemo(() => {
    return backgrounds.map((bg) => ({
      ...bg,
      src: `${import.meta.env.BASE_URL}${bg.src.startsWith('/') ? bg.src.slice(1) : bg.src}`,
    }));
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    updateText('name', value);
  };

  const handleJobTitleChange = (value: string) => {
    setJobTitle(value);
    updateText('title', value);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <main className="flex flex-col-reverse md:flex-row gap-4 md:gap-8 p-1 md:p-2 w-full max-w-7xl mx-auto flex-grow">
        <ControlPanel
          backgrounds={backgroundsWithBaseUrl}
          onSelectImage={(bg) => selectImage(bg, { name, title: jobTitle })}
          name={name}
          onNameChange={handleNameChange}
          jobTitle={jobTitle}
          onJobTitleChange={handleJobTitleChange}
          cymraegStatus={cymraegStatus}
          onCymraegStatusChange={updateCymraegStatus}
          onDownload={downloadImage}
          imageLoadingError={imageLoadingError}
        />
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
               <PreviewCanvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;