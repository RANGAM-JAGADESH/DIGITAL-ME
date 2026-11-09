# Digital Me

An AI-powered, talking version of me that answers questions about my education, skills and projects, using only my real documents.

A visitor opens the site, asks a question (or taps a suggestion), and a cartoon avatar of me answers out loud, changing its expression with the mood of the answer.

> **Status:** the text, retrieval, avatar and site are done. Cloned voice and lip-synced video are the next phase.

## How it works

```
question
   │
   ├─ close to a saved answer? ──────────────► instant answer (saved audio/video later)
   │      (vector match + an LLM check for in-between scores)
   │
   └─ otherwise ► search my documents (RAG) ► LLM writes the answer ► emotion tag ► avatar speaks
```

- **RAG:** my resume, FAQ and notes are cut into labeled chunks, turned into vectors and stored in Postgres with pgvector. Each question retrieves the 5 closest chunks, and the LLM must answer only from them, or say it doesn't know.
- **Saved answers:** 33 pre-generated answers, each with about 6 paraphrases, so common questions are instant and free.
- **Avatar:** an SVG cartoon with five emotions, blinking, eye movement and mouth shapes while speaking. It uses the browser's voice for now.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | Next.js (React), plain CSS with five switchable themes |
| Backend | Python, FastAPI |
| Database and vector search | Supabase PostgreSQL with pgvector (HNSW index) |
| Embeddings | all-MiniLM-L6-v2 through fastembed (ONNX, no PyTorch) |
| LLM | Groq (free tier) |
| Hosting | Vercel (site), Render (API), both free |

## Built-in safeguards

- Answers only from the knowledge base, and says so when it doesn't know
- Rate limit per visitor and a daily cap on AI calls
- CORS limited to the site's own address
- Prompt rules against instruction-override tricks, invented experience and private details
- An evaluation script (`run_eval.bat`) that asks 31 questions, including tricks, and grades the answers

## Run it locally (Windows)

Requirements: Python 3.11, Node.js, a free Supabase project and a free Groq API key.

```
setup.bat                 # Python environment and packages
copy backend\.env.example backend\.env      # then fill in your keys
apply_schema.bat          # create the database tables
run_ingest.bat            # load the knowledge base
seed_answers.bat          # pre-generate the saved answers
setup_frontend.bat        # install the website packages

run_api.bat               # terminal 1: API on http://127.0.0.1:8000
run_frontend.bat          # terminal 2: site on http://localhost:3000
run_eval.bat              # safety and quality check
```

## Project layout

```
backend/        FastAPI app (RAG, saved answers, rate limiting), scripts and SQL
frontend/       Next.js site: split layout with avatar and chat, About me tab
data/           the knowledge base: resume, FAQ, extra facts and speaking style
voice-service/  voice cloning service (in progress, runs on a local GPU)
Dockerfile.api  image for the free API host
```

## Roadmap

- [x] RAG chat with saved answers and suggested questions
- [x] Cartoon avatar with emotions, live captions, About me tab
- [x] Rate limiting, safety prompts and an evaluation suite
- [ ] Cloned voice (XTTS-v2) and lip-synced video for the saved answers
- [ ] Public deployment

## Notes

The voice model (XTTS-v2) is licensed for non-commercial use, which fits a personal portfolio. This project is an AI, and the site says so.
