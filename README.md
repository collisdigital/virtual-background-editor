# Virtual Background Editor

This project is a frontend-only web application that allows users to select a background image, add their name and job title, preview the result, and download a composite image.

## Technical Stack

-   **Language**: TypeScript 5.x
-   **Framework**: React 18 (with Vite)
-   **Image Manipulation**: Fabric.js 5.x
-   **Styling**: Tailwind CSS 3.x
-   **Testing**: Vitest (unit/component), Playwright (end-to-end)

## Project Structure

The project is structured as follows:

```
frontend/
├── public/
│   └── images/
│       └── backgrounds/    # Placeholder background images
├── src/
│   ├── components/         # Reusable UI components (ImageSelector, TextInput, PreviewCanvas)
│   ├── hooks/              # Custom React hooks (useImageProcessor)
│   ├── services/           # Image processing logic
│   ├── config/             # Background image configurations (backgrounds.ts)
│   ├── pages/              # Main application page
│   └── App.tsx             # Main application component
└── tests/
    ├── component/          # Unit/component tests
    └── e2e/                # End-to-end tests
```

## Setup

### Prerequisites

-   Node.js (v18 or later)
-   npm (v9 or later)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd virtual-background-editor
    ```

2.  **Install dependencies**:
    Navigate to the `frontend` directory and install the required npm packages.
    ```bash
    cd frontend
    npm install
    ```

## Running the Development Server

To start the Vite development server:

```bash
cd frontend
npm run dev
```

The application will typically be available at `http://localhost:5173`.

## Building for Production

To create a production build:

```bash
cd frontend
npm run build
```

This generates optimized static assets in `frontend/dist`.

## Running Tests

### Unit and Component Tests

```bash
cd frontend
npm run test
```

### End-to-End Tests

```bash
cd frontend
npm run test:e2e
```
