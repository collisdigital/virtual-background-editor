import { BackgroundImage } from '../config/backgrounds';
import ImageSelector from './ImageSelector';
import TextInput from './TextInput';
import SelectInput from './SelectInput';

interface ControlPanelProps {
  backgrounds: BackgroundImage[];
  onSelectImage: (bg: BackgroundImage) => void;
  name: string;
  onNameChange: (value: string) => void;
  jobTitle: string;
  onJobTitleChange: (value: string) => void;
  cymraegStatus: 'None' | 'Learner' | 'Fluent';
  onCymraegStatusChange: (status: 'None' | 'Learner' | 'Fluent') => void;
  onDownload: () => void;
  imageLoadingError: string | null;
}

const ControlPanel = ({
  backgrounds,
  onSelectImage,
  name,
  onNameChange,
  jobTitle,
  onJobTitleChange,
  cymraegStatus,
  onCymraegStatusChange,
  onDownload,
  imageLoadingError,
}: ControlPanelProps) => {
  return (
    <div className="w-full md:w-1/3 lg:w-1/4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        {imageLoadingError && (
          <p className="text-red-500 text-sm mb-2">{imageLoadingError}</p>
        )}
        <ImageSelector backgrounds={backgrounds} onSelect={onSelectImage} />
        <div className="space-y-4">
          <TextInput label="Name" value={name} onChange={onNameChange} />
          <TextInput
            label="Job Title"
            value={jobTitle}
            onChange={onJobTitleChange}
          />
          <SelectInput
            label="Cymraeg"
            value={cymraegStatus}
            options={[
              { value: 'None', label: 'None' },
              { value: 'Learner', label: 'Learner' },
              { value: 'Fluent', label: 'Fluent' },
            ]}
            onChange={(val) =>
              onCymraegStatusChange(val as 'None' | 'Learner' | 'Fluent')
            }
          />
        </div>
        <button
          onClick={onDownload}
          className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Download Image
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
