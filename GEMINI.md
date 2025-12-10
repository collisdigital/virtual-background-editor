# background-name-title-editor Development Guidelines

Last updated: 2025-12-10

## Active Technologies
- **Core:** TypeScript 5.x, React 18 (Vite), Tailwind CSS 3.x
- **Graphics:** Fabric.js 5.x (Canvas manipulation)
- **Testing:** Vitest (Unit/Component), Playwright (E2E)
- **Storage:** Client-side only (no backend)

## Project Structure

```text
frontend/
├── src/
│   ├── components/      # UI Components (ImageSelector, PreviewCanvas, Inputs)
│   ├── config/          # Configuration files (backgrounds.ts - single source of truth)
│   ├── hooks/           # Custom hooks (useImageProcessor.ts - core canvas logic)
│   ├── pages/           # Page layouts (HomePage.tsx)
│   └── test/            # Test setup (setup.ts)
└── tests/
    ├── component/       # Unit/Component tests (Vitest)
    ├── e2e/             # End-to-End tests (Playwright)
    │   └── utils/       # E2E helpers (canvas-helper.ts)
    └── hooks/           # Hook tests
```

## Commands

- **Development:** `cd frontend && npm run dev`
- **Unit Tests:** `cd frontend && npm test`
- **E2E Tests:** `cd frontend && npx playwright test`
- **Linting:** `cd frontend && npm run lint`

## Code Style

- **TypeScript:** Follow standard conventions.
- **Styling:** Use Tailwind CSS utility classes.
- **State:** Local React state for UI; Fabric.js for canvas state.

## Key Concepts & Architecture

### 1. Canvas Management (`useImageProcessor`)
The core logic resides in `frontend/src/hooks/useImageProcessor.ts`. This hook:
- Initializes the Fabric.js canvas.
- Manages the `ResizeObserver` for responsive scaling.
- Handles adding/removing/updating objects (background images, text placeholders, logos) based on the selected configuration.
- **Testing Hook:** Exposes the `fabric.Canvas` instance as `(element).__fabric` to the DOM node to allow E2E tests to inspect canvas objects directly.

### 2. Background Configuration (`backgrounds.ts`)
`frontend/src/config/backgrounds.ts` is the central configuration file. It exports:
- `backgrounds`: An array of `BackgroundImage` objects.
- **Constants:** Defaults for text styling (`DEFAULT_FONT_FAMILY`, `DEFAULT_TEXT_FILL`, etc.) and positioning.
- **Interfaces:** `LogoConfig`, `Placeholder`, `BackgroundImage`.
- **Refactoring Note:** Configuration objects must explicitly define all properties (e.g., `font`, `fontSize`) using the imported constants to ensure predictable rendering without hardcoded fallbacks in the hook logic.

### 3. Testing Strategy
- **Unit/Component:** Mocks `fabric` to test logic without a real browser environment.
- **E2E (Playwright):** Uses `frontend/tests/e2e/utils/canvas-helper.ts` to execute code in the browser context, accessing the exposed `__fabric` instance to verify that specific objects (by `name` property) exist on the canvas and have correct properties (text, visibility).

