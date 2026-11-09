"""Structure-aware chunking for the Digital Me knowledge base.

Pure Python (no heavy imports) so it can be tested on its own.
Each chunk carries its own label (section, project or question) so retrieval
finds complete, self-explanatory pieces instead of arbitrary 600-character windows.
"""
import re

SKIP_SECTIONS = ("instructions for digital me",)  # prompt-style text, not knowledge
MAX_CHARS = 900

_FAQ_Q = re.compile(r"^###\s*Q(\d+)\.\s*(.+?)\s*$", re.MULTILINE)
_BOLD_HEAD = re.compile(r"^\*\*(.+?):?\*\*\s*(.*)$")
_PROJECT_HEAD = re.compile(r"^###\s*\d+\.\s*(.+?)\s*$")


def clean(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_long(text: str, limit: int = MAX_CHARS) -> list[str]:
    """Split an over-long chunk on line boundaries, repeating its label line."""
    if len(text) <= limit:
        return [text]
    head, _, body = text.partition("\n")
    parts, current = [], ""
    for line in body.splitlines():
        if current and len(current) + len(line) + 1 > limit:
            parts.append(f"{head}\n{current.strip()}")
            current = ""
        current += line + "\n"
    if current.strip():
        parts.append(f"{head}\n{current.strip()}")
    return parts


def chunk_fixed(text: str, size: int = 600, overlap: int = 100) -> list[str]:
    text = text.strip()
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start:start + size].strip())
        start += size - overlap
    return [c for c in chunks if c]


def faq_items(text: str) -> list[tuple[int, str, str]]:
    """Return (number, question, answer) for each '### Qn. question' block."""
    matches = list(_FAQ_Q.finditer(text))
    items = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[m.end():end]
        body = re.sub(r"^## .*$", "", body, flags=re.MULTILINE)  # section headers
        body = re.sub(r"^---\s*$", "", body, flags=re.MULTILINE)
        body = re.sub(r"^\s*A:\s*", "", body.strip())
        items.append((int(m.group(1)), m.group(2).strip(), clean(body)))
    return items


def chunk_faq(text: str) -> list[str]:
    return [f"Question: {q}\nAnswer: {a}" for _, q, a in faq_items(text)]


def chunk_resume(text: str) -> list[str]:
    chunks: list[str] = []
    label, buf, skipping = "Profile", [], False

    def flush():
        body = clean("\n".join(buf))
        if body and not skipping:
            chunks.extend(split_long(f"{label}\n{body}"))
        buf.clear()

    for line in text.splitlines():
        s = line.strip()
        bold = _BOLD_HEAD.match(s)
        project = _PROJECT_HEAD.match(s)
        if bold:
            flush()
            title = bold.group(1).strip().rstrip(":")
            skipping = title.lower().startswith(SKIP_SECTIONS)
            label = title
            if bold.group(2).strip():
                buf.append(bold.group(2).strip())
        elif project:
            flush()
            label = f"Project: {project.group(1).strip()}"
        elif s == "---" or s.startswith("# "):
            continue
        else:
            buf.append(line)
    flush()
    return chunks


def chunk_sections(text: str) -> list[str]:
    """For files organised with '## Heading' sections."""
    chunks: list[str] = []
    label, buf = "", []

    def flush():
        body = clean("\n".join(buf))
        if body:
            chunks.extend(split_long(f"{label}\n{body}" if label else body))
        buf.clear()

    for line in text.splitlines():
        s = line.strip()
        if s.startswith("## "):
            flush()
            label = s[3:].strip()
        elif s.startswith("# "):
            continue
        else:
            buf.append(line)
    flush()
    return chunks


def chunk_document(name: str, text: str) -> list[str]:
    if name == "faq.txt":
        chunks = chunk_faq(text)
    elif name == "resume.txt":
        chunks = chunk_resume(text)
    else:
        chunks = chunk_sections(text)
    return chunks or chunk_fixed(text)
