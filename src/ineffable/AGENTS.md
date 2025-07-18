# Development Guide

This is a prototype of a structured tool for writing with AI support. The user can edit a document at paragraph, sentence, or word level, and add annotations to individual elements. The plan is to add writing best practices and use AI to generate annotations and suggestions. 

## Tech stack

- React
- TypeScript
- Vite
- [Vitest](https://vitest.dev/)
- tailwindcss
- zustand for state management
- AI support still to come

## Workflow

1. Install dependencies and run tests
   ```bash
   cd src/ineffable
   npm install
   npm test
   ```
   The test command runs Vitest. It should pass before committing changes.
1. For development use `npm run dev`.

## Code organization

1. Source in src/ineffable
    1. Feature code goes under `src/ineffable/src/features/`
    1. shared components under `src/ineffable/src/components/`
    1. Utilities under `src/ineffable/src/utils/`.
    1. Add tests for new functionality in the feature directory next to the code.
1. design docs in docs/
1. Update `README.md` when changing scripts or adding dependencies.

## Coding style

1. Use TypeScript
1. Write readable code
    1. Factor out small, clearly named helper functions
    1. Use pure functions for logic when practical
    1. All functions except the most trivial should have docstrings.
    1. Include inline comments that guide the reader through the code
        - what is each block of code doing
        - more importantly, why
1. Factor out and unit test the logic whenever possible to make the UI layer straightforward

1. Document high level architectural decision in files in docs/
    1. e.g. state management is described in state.md
    1. the design system in design-system.md
    1. Add other files as appropriate

