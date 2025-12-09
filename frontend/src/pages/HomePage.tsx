import { useState, useRef, useEffect } from 'react';
import ImageSelector from '../components/ImageSelector';
import PreviewCanvas from '../components/PreviewCanvas';
import TextInput from '../components/TextInput';
import { backgrounds } from '../config/backgrounds';
import { useImageProcessor } from '../hooks/useImageProcessor';

const HomePage = () => {
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectImage, updateText, downloadImage, imageLoadingError } = useImageProcessor(canvasRef);

  useEffect(() => {
    document.title = 'Virtual Background Editor';
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
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            {imageLoadingError && (
              <p className="text-red-500 text-sm mb-2">{imageLoadingError}</p>
            )}
            <ImageSelector 
              backgrounds={backgrounds} 
              onSelect={(bg) => selectImage(bg, { name, title: jobTitle })} 
            />
            <div className="space-y-4">
              <TextInput label="Name" value={name} onChange={handleNameChange} />
              <TextInput
                label="Job Title"
                value={jobTitle}
                onChange={handleJobTitleChange}
              />
            </div>
            <button
              onClick={downloadImage}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Download Image
            </button>
          </div>
        </div>
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
