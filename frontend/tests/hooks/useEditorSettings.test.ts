import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { backgrounds } from '../../src/config/backgrounds';
import { useEditorSettings } from '../../src/hooks/useEditorSettings';

const storageKey = 'virtual-background-editor.settings';

describe('useEditorSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('persists all settings and restores them on remount', () => {
    const settings = {
      name: 'Jane Doe',
      jobTitle: 'Engineer',
      backgroundId: backgrounds[0].id,
      cymraegStatus: 'Learner' as const,
    };
    const first = renderHook(() => useEditorSettings());
    act(() => first.result.current[1](settings));
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(settings);
    first.unmount();
    const restored = renderHook(() => useEditorSettings());
    expect(restored.result.current[0]).toEqual(settings);
  });

  it.each(['not json', 'null', '42', '{"name":false,"jobTitle":[],"backgroundId":"user-upload-1","cymraegStatus":"invalid"}'])(
    'ignores invalid saved values: %s', (stored) => {
      localStorage.setItem(storageKey, stored);
      const { result } = renderHook(() => useEditorSettings());
      expect(result.current[0]).toEqual({
        name: '', jobTitle: '', backgroundId: null, cymraegStatus: 'None',
      });
    }
  );

  it('keeps working when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
    const { result } = renderHook(() => useEditorSettings());
    act(() => result.current[1]((settings) => ({ ...settings, name: 'Jane Doe' })));
    expect(result.current[0].name).toBe('Jane Doe');
  });
});