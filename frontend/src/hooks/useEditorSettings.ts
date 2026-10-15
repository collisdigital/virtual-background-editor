import { useEffect, useState } from 'react';
import { backgrounds } from '../config/backgrounds';

export interface EditorSettings {
  name: string;
  jobTitle: string;
  backgroundId: string | null;
  cymraegStatus: 'None' | 'Learner' | 'Fluent';
}

const storageKey = 'virtual-background-editor.settings';
const defaults: EditorSettings = {
  name: '',
  jobTitle: '',
  backgroundId: null,
  cymraegStatus: 'None',
};

const readSettings = (): EditorSettings => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!stored || typeof stored !== 'object') return defaults;
    const values = stored as Record<string, unknown>;
    return {
      name: typeof values.name === 'string' ? values.name : '',
      jobTitle: typeof values.jobTitle === 'string' ? values.jobTitle : '',
      backgroundId: backgrounds.some((background) => background.id === values.backgroundId)
        ? values.backgroundId as string : null,
      cymraegStatus: values.cymraegStatus === 'Learner' || values.cymraegStatus === 'Fluent'
        ? values.cymraegStatus : 'None',
    };
  } catch {
    return defaults;
  }
};

export const useEditorSettings = () => {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      return;
    }
  }, [settings]);

  return [settings, setSettings] as const;
};