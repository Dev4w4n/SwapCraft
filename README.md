# SwapCraft

SwapCraft is a React + Vite app with an Express server for AI-powered object swapping.

## Prerequisites

- Node.js (recommended: latest LTS)
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Open `.env` and add your Google Gemini API key:

```env
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```

You can get this key from Google AI Studio.

## Run the app (development)

Start the dev server:

```bash
npm run dev
```

The app runs on:

- `http://localhost:3000`

## Other useful scripts

- Build for production:
  ```bash
  npm run build
  ```
- Preview production build:
  ```bash
  npm run preview
  ```
- Type check:
  ```bash
  npm run lint
  ```
- Run tests:
  ```bash
  npm run test
  ```

## Notes

- Do **not** commit your `.env` file.
- Keep your API key private.
