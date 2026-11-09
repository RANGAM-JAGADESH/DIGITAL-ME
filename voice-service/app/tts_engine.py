"""XTTS-v2 voice cloning engine. Loads the model once and caches generated audio."""
import hashlib
import os
import threading
from pathlib import Path

# XTTS-v2 weights are under the Coqui Public Model License (non-commercial use).
# Setting this accepts that license so the download does not wait for a prompt.
os.environ.setdefault("COQUI_TOS_AGREED", "1")

import torch  # noqa: E402
from TTS.api import TTS  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SAMPLE_DIR = ROOT / "data" / "voice"
OUT_DIR = Path(__file__).resolve().parents[1] / "output"
OUT_DIR.mkdir(exist_ok=True)

MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
_tts = None
_lock = threading.Lock()  # one GPU job at a time (6 GB VRAM)


def device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def sample_files() -> list[Path]:
    return sorted(SAMPLE_DIR.glob("*.wav"))


def _get_tts() -> TTS:
    global _tts
    if _tts is None:
        _tts = TTS(MODEL_NAME).to(device())
    return _tts


def synthesize(text: str, language: str = "en") -> Path:
    text = text.strip()
    if not text:
        raise ValueError("text is empty")
    samples = sample_files()
    if not samples:
        raise FileNotFoundError(f"No .wav voice samples found in {SAMPLE_DIR}")

    key = hashlib.sha1(
        (text + language + "".join(f"{s.name}{s.stat().st_mtime_ns}" for s in samples)).encode()
    ).hexdigest()[:16]
    out = OUT_DIR / f"{key}.wav"
    if out.exists():
        return out  # same text and same voice: reuse

    with _lock:
        tts = _get_tts()
        tts.tts_to_file(
            text=text,
            speaker_wav=[str(s) for s in samples],
            language=language,
            file_path=str(out),
            split_sentences=True,
        )
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    return out
