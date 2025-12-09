import '@testing-library/jest-dom';

global.ResizeObserver = class ResizeObserver {
  /* eslint-disable @typescript-eslint/no-empty-function */
  observe() {}
  unobserve() {}
  disconnect() {}
  /* eslint-enable @typescript-eslint/no-empty-function */
};