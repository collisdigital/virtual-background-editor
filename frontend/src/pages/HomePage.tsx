import { useState, useRef } from 'react';
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

  const handleNameChange = (value: string) => {
    setName(value);
    updateText('name', value);
  };

  const handleJobTitleChange = (value: string) => {
    setJobTitle(value);
    updateText('title', value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="py-4">
        <h1 className="text-2xl md:text-4xl font-bold">Virtual Background Editor</h1>
      </header>
      <main className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8 w-full">
        <div className="w-full md:w-1/4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Controls</h2>
            {imageLoadingError && (
              <p className="text-red-500 text-sm mb-2">{imageLoadingError}</p>
            )}
            <ImageSelector backgrounds={backgrounds} onSelect={selectImage} />
            <TextInput label="Name" value={name} onChange={handleNameChange} />
            <TextInput
              label="Job Title"
              value={jobTitle}
              onChange={handleJobTitleChange}
            />
            <button
              onClick={downloadImage}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Download Image
            </button>
          </div>
        </div>
        <div className="w-full md:w-3/4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Preview</h2>
            <PreviewCanvas ref={canvasRef} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
