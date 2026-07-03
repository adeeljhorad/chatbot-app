# ChatBot (React + Node/Express)

A reactive chat app: React (Vite) frontend, Express backend that hides
your Groq API key server-side.

## Run locally

1. Install Node.js (v18+).
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and paste your real Groq API key:
   ```
   cp .env.example .env
   ```
4. Start the backend (in one terminal):
   ```
   npm start
   ```
5. In development, run Vite separately for hot-reload while editing:
   ```
   npm run dev
   ```
   This opens the app at `http://localhost:5173` and proxies `/api` calls
   to the Express server at `http://localhost:3000`.

   For a normal (non-editing) run, you only need step 4 — but first build
   the frontend once with `npm run build`, since Express serves the built
   files from `/dist`.

## Deploy for free (Render.com)

1. Push this whole folder to a GitHub repo.
2. Go to render.com → New → Web Service → connect your repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Under "Environment", add `GROQ_API_KEY` with your real key.
6. Deploy — you'll get a public URL like `https://yourapp.onrender.com`.
   That single link runs everything: the React frontend and the API.

## Notes

- `FREE_LIMIT` in `server.js` controls free messages per session.
- Session tracking is in-memory — resets if the server restarts. For a
  real client product, swap `sessionCounts` for Firebase or a database.
- Never commit your real `.env` file — only `.env.example`.
- The system prompt lives only in `server.js`, not in the browser, so it
  can't be viewed or edited via browser dev tools.
