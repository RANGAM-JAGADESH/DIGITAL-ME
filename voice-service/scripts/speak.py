import sys
import time

from app import tts_engine

text = " ".join(sys.argv[1:]) or (
    "Hi, I am the digital version of Jashu. Ask me about my education, skills and projects."
)
print("device:", tts_engine.device())
print("voice samples:", [s.name for s in tts_engine.sample_files()])
start = time.time()
path = tts_engine.synthesize(text)
print(f"saved: {path}  ({time.time() - start:.1f}s)")
