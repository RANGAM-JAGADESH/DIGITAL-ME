from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app import tts_engine

app = FastAPI(title="Digital Me Voice Service")


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": tts_engine.device(),
        "voice_samples": [s.name for s in tts_engine.sample_files()],
    }


@app.post("/tts")
def tts(req: TTSRequest):
    try:
        path = tts_engine.synthesize(req.text, req.language)
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return FileResponse(path, media_type="audio/wav", filename=path.name)
