import sys

from app.llm import generate
from app.rag import retrieve

question = " ".join(sys.argv[1:]) or "Tell me about your education"
ctx = retrieve(question)
print(generate(question, ctx))
