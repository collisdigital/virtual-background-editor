# Tasks: Virtual Background Editor

**Input**: Design documents from `/specs/001-virtual-bg-editor/`

## Phase 1: Setup

**Purpose**: Project initialization and basic structure.

- [ ] T001 Initialize Vite project with React and TypeScript in `frontend/`.
- [ ] T002 [P] Install and configure Tailwind CSS in `frontend/`.
- [ ] T003 [P] Install Fabric.js in `frontend/`.
- [ ] T004 [P] Install and configure Vitest in `frontend/`.
- [ ] T005 [P] Install and configure Playwright in `frontend/`.
- [ ] T006 Create project directory structure as per `plan.md` inside `frontend/`.

---

## Phase 2: Foundational

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [ ] T007 Define data models in `frontend/src/config/backgrounds.ts` based on `data-model.md`.
- [ ] T008 [P] Create basic layout and routing in `frontend/src/App.tsx`.
- [ ] T009 [P] Add placeholder background images to `frontend/public/images/backgrounds/`.
- [ ] T010 Create a configuration file in `frontend/src/config/backgrounds.ts` for the placeholder images, including their placeholder definitions.

---

## Phase 3: User Story 1 - Select Background & Enter Details (MVP)

**Goal**: A user can select a background, enter their name and title, and see a live preview.

**Independent Test**: Can be fully tested by selecting a background, entering name/title, and observing the preview.

### Tests for User Story 1

- [ ] T011 [P] [US1] Write unit/component tests for `ImageSelector`, `TextInput`, and `PreviewCanvas` in `frontend/tests/component/`.
- [ ] T012 [US1] Write E2E test for selecting an image and entering text in `frontend/tests/e2e/`.

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create `ImageSelector` component in `frontend/src/components/ImageSelector.tsx` to display and select background images.
- [ ] T014 [P] [US1] Create `TextInput` component in `frontend/src/components/TextInput.tsx` for name and job title inputs.
- [ ] T015 [US1] Create `PreviewCanvas` component in `frontend/src/components/PreviewCanvas.tsx` to display the selected image and text overlays.
- [ ] T016 [US1] Implement `useImageProcessor` hook in `frontend/src/hooks/useImageProcessor.ts` to manage canvas state and text rendering using Fabric.js.
- [ ] T017 [US1] Integrate components into the main page in `frontend/src/pages/HomePage.tsx`.

---

## Phase 4: User Story 2 - Download Customized Background

**Goal**: A user can download their customized background image.

**Independent Test**: Can be fully tested by customizing a background and successfully downloading the final image.

### Tests for User Story 2

- [ ] T018 [P] [US2] Write unit/component test for the download functionality in `frontend/tests/component/`.
- [ ] T019 [US2] Write E2E test for downloading the customized image in `frontend/tests/e2e/`.

### Implementation for User Story 2

- [ ] T020 [US2] Add "Download" button to the main page in `frontend/src/pages/HomePage.tsx`.
- [ ] T021 [US2] Implement download functionality in `useImageProcessor` hook in `frontend/src/hooks/useImageProcessor.ts` to export the canvas as an image.

---

## Phase 5: User Story 3 - Administers New Background Images

**Goal**: A developer can easily add new background images to the application.

**Independent Test**: Can be fully tested by adding a new image and its configuration, then verifying it appears in the application's selectable list and text placeholders work correctly.

### Tests for User Story 3

- [ ] T022 [P] [US3] Write unit/component test for the configuration-based image loading in `frontend/tests/component/`.

### Implementation for User Story 3

- [ ] T023 [US3] Refactor image loading to use the configuration file from `frontend/src/config/backgrounds.ts`.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T024 [P] Implement responsive design for different screen sizes.
- [ ] T025 [P] Add accessibility features (e.g., ARIA attributes, keyboard navigation).
- [ ] T026 [P] Add comprehensive error handling and user feedback.
- [ ] T027 [P] Update `README.md` with detailed project information.
- [ ] T028 [P] Perform final cross-browser testing.
