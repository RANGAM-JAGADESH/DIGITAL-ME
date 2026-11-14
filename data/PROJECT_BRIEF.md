# Digital Me: project brief for Cursor

## 1. What this project is, and why
Digital Me is a public website where a visitor chats with an **AI version of Jagadesh ("Jashu")**, a B.Tech CSE (AI) student and backend developer. It is meant as a **portfolio and recruiter-screening tool**: instead of reading a resume, a visitor asks questions and a cartoon avatar answers out loud.

Key principles (do not break these):
- **Answers come only from the owner's real documents** (resume, FAQ, extra facts). If the documents don't cover it, the avatar says so. It never invents experience.
- **It always discloses that it is an AI** (site notice, and in answers when asked).
- **Zero cost.** Every service is on a free tier. No paid APIs.
- **The unfinished "TruthLens AI" project must never be mentioned.** It was deliberately removed from the knowledge base.
- Private details (phone number, home address) are never shared. The owner has decided his Gmail WILL be shown (not built yet, see section 8).
- It is a **public GitHub repo**: no secrets, no voice recordings, no photos in git.

## 2. What exists today (done and deployed)
- **Live site:** https://digital-me-phi.vercel.app (Vercel, root directory `frontend`)
- **Live API:** https://digital-me-n8hu.onrender.com (Render free web service, Docker, Frankfurt)
- **Repo:** github.com/RANGAM-JAGADESH/DIGITAL-ME (public, branch `main`; Vercel and Render auto-deploy from it)
- A free cron-job.org job pings `/api/suggestions` every 10 minutes so Render's free server doesn't sleep and Supabase doesn't pause.

### Features
1. **RAG chat** over the owner's documents, with an emotion tag on every answer.
2. **33 saved (pre-generated) answers**, each with about 6 paraphrases, so common questions are instant and use no LLM call.
3. **Suggested-question buttons** (8 of them) from the database.
4. **Cartoon avatar** (SVG, built in code) with 5 emotions (neutral, happy, excited, thoughtful, serious), blinking, eye movement, breathing, head nod, and mouth shapes while speaking. It plays a saved video if a `video_url` exists, then saved audio if `audio_url` exists, then the browser's built-in voice.
5. **Split layout:** avatar on the left, chat on the right. On phones a compact header with a small avatar sits above the chat.
6. **About me tab:** animated stats, journey, skills, filterable project cards with "Ask about this" buttons that jump into the chat, currently exploring, how I work, certifications, links.
7. **Settings menu:** read-aloud on/off, captions on/off, 5 colour themes (saved in the browser; light-mode devices default to the cream theme).
8. **Safety:** per-visitor rate limit, daily cap on AI calls, CORS locked to the site, prompt rules against tricks, and a 31-question evaluation script.
9. **Link-preview card** (`opengraph-image.png`), site icon, and metadata.

## 3. Architecture and request flow
```
Browser (Next.js on Vercel)
   │  POST /api/chat {question}
   ▼
FastAPI on Render  ──►  Supabase Postgres + pgvector
   │                      (documents, answers, answer_variants, question_log)
   ├─ embed question (fastembed, all-MiniLM-L6-v2, 384 numbers)
   ├─ top-3 saved answers (best of each answer's question + paraphrases)
   │     score >= 0.80  → return saved answer ("similarity")
   │     daily AI cap reached → close saved answer (>= 0.60) or "busy"
   │     0.40 <= score < 0.80 → LLM judge picks a saved answer or none ("llm")
   │     otherwise → live RAG
   └─ live RAG: top-5 document chunks → Groq LLM → JSON {answer, emotion}
         (if the LLM fails: fall back to a saved answer >= 0.60, else 503)
```
Response shape of `POST /api/chat`:
`{answer, emotion, audio_url, video_url, source: "saved"|"live", matched_by: "similarity"|"llm"|"fallback"|null, matched_question, score, sources}`
Other endpoints: `GET /health`, `GET /api/suggestions`.

## 4. Tech stack
| Part | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, plain JavaScript, plain CSS (no Tailwind) |
| Backend | Python 3.11, FastAPI, pydantic-settings, slowapi (rate limit), psycopg 3 + psycopg_pool, pgvector |
| Database | Supabase PostgreSQL + pgvector (HNSW cosine indexes); row-level security enabled on all tables |
| Embeddings | `fastembed` running `sentence-transformers/all-MiniLM-L6-v2` (ONNX, no PyTorch). Falls back to sentence-transformers if `EMBED_BACKEND=st`. |
| LLM | Groq free tier. Model name comes from the `GROQ_MODEL` env variable (Groq renames models, so never hard-code). |
| Hosting | Vercel (site), Render Docker (API, 512 MB RAM, 0.1 CPU, sleeps after 15 min idle), Supabase free |
| Voice (written, not yet run) | Coqui XTTS-v2 via `coqui-tts`, FastAPI service on port 8001, PyTorch 2.6.0 CUDA 12.4 |
| Dev machine | Windows 11, PowerShell, NVIDIA RTX 4050 (6 GB), Python 3.11 venvs, Node 24 |

## 5. Repository layout
```
backend/
  app/        config, db (pool), embedder, rag, chunking, llm, router, paraphrase, answers, service, main
  scripts/    apply_schema, ingest, seed_answers, eval_questions, verify_embeddings, ask
  sql/schema.sql    requirements.txt    .env.example   (no tests yet)
frontend/
  app/        layout.js, page.js, globals.css (themes), mobile.css, icon.png, opengraph-image.png
  components/ DigitalMe.jsx (chat, speech, state), Avatar.jsx (animation), CartoonFace.jsx (SVG, emotions, mouth shapes), ProfilePanel.jsx (About me)
  data/       profile.js (About me content), look.js (avatar presets: CLASSIC active, PERSONAL available)
data/         resume.txt, faq.txt, profile_extra.txt (knowledge base), style.txt (speaking style), voice/ (git-ignored)
voice-service/  XTTS-v2 FastAPI service (app/main.py, app/tts_engine.py, scripts/speak.py)
Dockerfile.api  .dockerignore  README.md  and many .bat helper scripts (see below)
```
Helper scripts (run from the project root in PowerShell with `.\name.bat`): `setup`, `apply_schema`, `run_ingest`, `seed_answers` (flags `--limit N`, `--only 13,14`, `--only-new`), `run_api`, `run_eval` (flag `--only text`), `verify_embeddings`, `update_backend`, `setup_frontend`, `run_frontend`, `setup_voice`, `run_voice`, `speak_test`.

## 6. Key design decisions
- **Chunking is structure-aware** (`backend/app/chunking.py`): one chunk per FAQ Q&A pair, one per resume section or project (with a label line like "Project: SearchX"), one per `##` section in `profile_extra.txt`. The "Instructions for Digital Me" section of the resume is skipped. `style.txt` is used in the prompt, not retrieved.
- **Saved answers use paraphrases** because the small embedding model scores real paraphrases low (sometimes 0.36), so an LLM judge handles the 0.40 to 0.80 band.
- **Emotion** is chosen by the LLM per answer and drives the avatar's face.
- **No PyTorch in the backend image** (Render has 512 MB). The model is pre-downloaded at Docker build time.
- **Avatar look** is configured in `frontend/data/look.js` (`export const LOOK = CLASSIC`). `PERSONAL` is wavy hair, light stubble, mustache, glasses, earring, chain. The owner chose CLASSIC (short black hair, navy sweater, no glasses).

## 7. Gotchas
- Never change the embedding model without re-running `run_ingest.bat` and `seed_answers.bat`. Check with `verify_embeddings.bat` (should print similarity 1.0000).
- pgvector returns `Vector` objects, so use `.to_numpy()` when reading stored vectors.
- Windows PowerShell needs `.\script.bat`. "LF will be replaced by CRLF" git warnings are harmless.
- Smart App Control was turned off so PyTorch DLLs load.
- Separate virtual environments: `backend\.venv` and `voice-service\.venv`, both Python 3.11. SadTalker (video, optional) needs its own Python 3.10 environment.
- Free-tier limits change: check Groq and Render before relying on numbers. First request after a sleep can take about a minute.
- Known data bug: `data/profile_extra.txt` has glued names ("JAGADESHhas", "JAGADESHis") from an earlier find-and-replace. Search all `data/*.txt` for the pattern `JAGADESH[a-z]` and fix.
- `data/profile_extra.txt` already has an `Email:` line added but it is not live (needs ingest and a push).
- XTTS-v2 is non-commercial licensed, which is fine for a personal portfolio.

## 8. Remaining tasks (with technology and detail)
**A. Contact email (decided: show the owner's Gmail)**
- Add an Email button (`mailto:`) to `links` in `frontend/data/profile.js`, and the address to the "Online profiles" section of `data/profile_extra.txt`.
- In `backend/app/llm.py` change the privacy rule: never share phone or home address, but the email, GitHub and LinkedIn from the context MAY be shared.
- In `backend/scripts/eval_questions.py` change the "privacy: email" case to expect the address, keep phone and address cases as refusals. Then run `run_ingest.bat` and push.

**B. Fix the glued-name typos** (section 7) and re-ingest.

**C. Polish for recruiters**
- Backend tests with **pytest** and **httpx**: chunking (pure functions), `service.answer` paths with monkeypatching (similarity, LLM judge, live, daily cap, LLM failure), and API tests with FastAPI `TestClient` (health, validation 422, rate limit 429 via `limiter.reset()`, CORS allow and block). Set dummy env vars in `conftest.py` before importing the app. Add `backend/requirements-dev.txt` and `pytest.ini`.
- **GitHub Actions** (`.github/workflows/ci.yml`): backend tests (install requirements without fastembed), frontend `npm ci` and `npm run build`, and a Docker build of `Dockerfile.api`.
- README refresh: live link, CI badge, architecture, limits.

**D. Voice (XTTS-v2).** The owner recorded about 1.5 minutes as `.m4a`.
- Convert with FFmpeg: `ffmpeg -i sample.m4a -ac 1 -ar 22050 -sample_fmt s16 sample.wav`, save to `data/voice/sample.wav` (git-ignored). Then `setup_voice.bat` and `speak_test.bat`.
- Done when `speak_test.bat` produces a WAV in his voice on the RTX 4050.

**E. Saved audio for the 33 answers** (new `backend/scripts/generate_audio.py`)
- For each row in `answers`, call the local voice service `POST /tts`, convert to a small mono MP3 with FFmpeg, upload to a public **Supabase Storage** bucket, and write the URL to `answers.audio_url`. Make it idempotent (skip unchanged text). Use the service-role key only in `backend/.env`, never in the frontend.
- The frontend already plays `audio_url`. Done when saved questions speak in his voice with the laptop off.

**F. Audio-driven mouth movement**
- In `Avatar.jsx`, use the **Web Audio API** (`AudioContext` plus `AnalyserNode`) to drive mouth openness from the audio's loudness while `audio_url` plays. Keep the random mouth shapes for the browser-voice fallback (no audio stream is available there).

**G. Voice for brand-new questions (laptop on)**
- Expose `voice-service` through a **Cloudflare Tunnel** (`cloudflared`). The Render backend calls it with a short timeout and a shared-secret header, and falls back silently to the browser voice. New env variables: `VOICE_SERVICE_URL`, `VOICE_SERVICE_TOKEN`. Add rate limiting and auth on the voice service.

**H. Optional: Hugging Face ZeroGPU backup** (Gradio app wrapping XTTS) for when the laptop is off. Quota is limited, so check current limits first.

**I. Visitor-question review** (`backend/scripts/review_questions.py`)
- Read `question_log` rows where source is `live` or `fallback`, group similar questions by embedding, and print the most frequent uncovered ones so the owner can add FAQ entries.

**J. On request only:** a **resume PDF without the phone number** (generate a sanitized PDF into `frontend/public/` and add a download button).

**K. Optional, later:** real-photo lip-sync video clips (SadTalker or Wav2Lip, one GPU model at a time on 6 GB, output to `answers.video_url`; needs D first). Admin login (JWT), error monitoring (Sentry), custom domain (the only paid item).

## 9. MCP servers (connectors) useful for the remaining tasks
Configure in Cursor settings (MCP). Keep tokens out of git.
| MCP | Use it for | Notes |
|---|---|---|
| **Supabase** | Inspect tables, run SELECTs, create the audio storage bucket, check `question_log` (tasks E, I) | It touches the live database. Prefer read-only and a project-scoped token. |
| **GitHub** | Pull requests, check Actions results (task C) | Minimal token scopes. |
| **Context7** | Current docs for Next.js, FastAPI, slowapi, coqui-tts, Web Audio API (tasks C, D, F) | Safe, read-only. |
| **Render** and **Vercel** | Read deploy logs and environment settings (tasks A, G) | Optional. Avoid letting an agent change environment variables. |
| **Playwright (browser automation)** | Test the phone layout and chat flow (tasks A, F) | Optional. |
| **Sentry** | Error monitoring | Only if "error monitoring" is added later. |
Not needed: Figma (the UI is done in code), Gmail, Google Drive.

## 10. How the owner likes to work
- Complete, ready-to-use files rather than partial diffs.
- Step-by-step Windows PowerShell commands with exact paths.
- **Ask before design decisions.** Do not start building until the owner says "go".
- Say honestly what could not be tested. Do not claim things were verified when they weren't.