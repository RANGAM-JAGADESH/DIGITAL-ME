"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import ProfilePanel from "./ProfilePanel";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SLOW_AFTER_MS = 6000;
const THEMES = [
  { id: "oxford", label: "Oxford blue", color: "#7c9ed9" },
  { id: "mint", label: "Electric mint", color: "#3df5b0" },
  { id: "royal", label: "Royal blue and cream", color: "#2f55d4" },
  { id: "lime", label: "Lime", color: "#a3e635" },
  { id: "forest", label: "Forest", color: "#7bc950" },
];
const THEME_IDS = THEMES.map((t) => t.id);
const GREETING =
  "Hi, I'm the digital version of Jagadesh, but everyone calls me Jashu. Ask me about my education, skills or projects, or tap one of the questions below.";

function readPref(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function savePref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage can be unavailable (private mode); preferences just won't persist */
  }
}

export default function DigitalMe() {
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [videoUrl, setVideoUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [theme, setTheme] = useState("oxford");
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [tab, setTab] = useState("chat");

  const logEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const recRef = useRef(null);
  const voiceOnRef = useRef(true);

  const started = messages.length > 1;

  // saved preferences, theme and capabilities (runs once in the browser)
  useEffect(() => {
    setVoiceOn(readPref("dm-voice", "on") === "on");
    setCaptionsOn(readPref("dm-captions", "on") === "on");

    const preview = new URLSearchParams(window.location.search).get("theme");
    if (THEME_IDS.includes(preview)) {
      document.documentElement.dataset.theme = preview; // preview only, not saved
      setTheme(preview);
    } else if (THEME_IDS.includes(document.documentElement.dataset.theme)) {
      setTheme(document.documentElement.dataset.theme);
    }

    setCanListen(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    fetch(`${API}/api/suggestions`)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((d) => setSuggestions(d.questions || []))
      .catch(() => setSuggestions([]));

    const onKey = (e) => {
      if (e.key === "Escape") stopSpeech();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopSpeech();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    voiceOnRef.current = voiceOn;
    if (!voiceOn) stopSpeech();
  }, [voiceOn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    logEndRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, loading]);

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  function changeVoice(on) {
    setVoiceOn(on);
    savePref("dm-voice", on ? "on" : "off");
  }

  function changeCaptions(on) {
    setCaptionsOn(on);
    savePref("dm-captions", on ? "on" : "off");
  }

  function changeTheme(id) {
    document.documentElement.dataset.theme = id;
    setTheme(id);
    savePref("dm-theme", id);
  }

  // Layer order for playback: saved video, then saved audio, then the browser's own voice.
  function playAnswer(data) {
    setEmotion(data.emotion || "neutral");
    setVideoUrl(data.video_url || null);
    setCaption(data.answer || "");
    if (data.video_url) return; // the <video> element reports play and end itself

    if (data.audio_url) {
      const audio = new Audio(data.audio_url);
      audioRef.current = audio;
      audio.onplay = () => setSpeaking(true);
      audio.onended = audio.onerror = audio.onpause = () => setSpeaking(false);
      audio.play().catch(() => setSpeaking(false));
      return;
    }

    if (voiceOnRef.current && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(data.answer);
      utterance.lang = "en-IN";
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  const send = useCallback(
    async (text, isRetry = false) => {
      const question = text.trim();
      if (!question || loading) return;

      stopSpeech();
      setVideoUrl(null);
      setCaption("");
      if (isRetry) {
        setMessages((m) => m.filter((x) => !x.error));
      } else {
        setMessages((m) => [...m, { role: "user", text: question }]);
        setInput("");
      }
      setLoading(true);
      setSlow(false);
      const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);

      try {
        const res = await fetch(`${API}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (!res.ok) {
          const detail = data && typeof data.detail === "string" ? data.detail : null;
          throw new Error(detail || "Something went wrong. Please try again.");
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.answer, instant: data.source === "saved" },
        ]);
        playAnswer(data);
      } catch (err) {
        const message =
          err instanceof TypeError
            ? "I can't reach my server right now."
            : err.message;
        setMessages((m) => [
          ...m,
          { role: "assistant", text: message, error: true, retry: question },
        ]);
      } finally {
        clearTimeout(slowTimer);
        setLoading(false);
        setSlow(false);
        // keep typing flow on desktop; on touch screens this would pop the keyboard open
        if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
      }
    },
    [loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  function resetChat() {
    stopSpeech();
    setVideoUrl(null);
    setCaption("");
    setEmotion("neutral");
    setInput("");
    setMessages([{ role: "assistant", text: GREETING }]);
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopSpeech();
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
    };
    recRef.current = rec;
    rec.start();
  }

  const status = listening
    ? "Listening…"
    : loading
    ? "Thinking…"
    : speaking
    ? "Speaking…"
    : "Ready";

  return (
    <main className="shell">
      {/* ---------------- left half: avatar ---------------- */}
      <section className="stage" aria-label="Avatar">
        <div className="stage-top">
          <div className="who">
            <h1>Jagadesh</h1>
            <p>Digital Me · AI version</p>
          </div>

          <details className="settings">
            <summary aria-label="Settings" title="Settings">
              ⚙
            </summary>
            <div className="settings-panel">
              <label className="settings-row">
                <span>Read answers aloud</span>
                <input
                  type="checkbox"
                  checked={voiceOn}
                  onChange={(e) => changeVoice(e.target.checked)}
                />
              </label>
              <label className="settings-row">
                <span>Captions</span>
                <input
                  type="checkbox"
                  checked={captionsOn}
                  onChange={(e) => changeCaptions(e.target.checked)}
                />
              </label>
              <div className="settings-row">
                <span>Theme</span>
                <div className="theme-dots" role="group" aria-label="Theme">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="theme-dot"
                      style={{ background: t.color }}
                      aria-label={t.label}
                      aria-pressed={theme === t.id}
                      title={t.label}
                      onClick={() => changeTheme(t.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        <Avatar
          videoUrl={videoUrl}
          speaking={speaking}
          emotion={emotion}
          status={status}
          onVideoPlay={() => setSpeaking(true)}
          onVideoEnd={() => setSpeaking(false)}
        />

        <div className="stage-actions">
          {speaking && (
            <button type="button" className="stop-btn" onClick={stopSpeech}>
              ■ Stop <span className="kbd">Esc</span>
            </button>
          )}
        </div>

        <p className={`caption ${captionsOn && speaking && caption ? "show" : ""}`}>{caption}</p>

        <p className="note">
          This is an AI, not the real Jagadesh. It answers only from his actual resume and notes,
          and says so when it doesn&apos;t know. Avatar preview: cloned voice and video are coming
          soon.
        </p>
      </section>

      {/* ---------------- right half: chat ---------------- */}
      <section className="chat" aria-label="Chat">
        <header className="chat-head">
          <div>
            <h2>Chat with Jagadesh</h2>
            <p>Ask about his education, skills and projects</p>
          </div>
          {started && (
            <button type="button" className="ghost-btn" onClick={resetChat}>
              New chat
            </button>
          )}
        </header>

        <nav className="tabs" role="tablist" aria-label="Sections">
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === "chat"}
            onClick={() => setTab("chat")}
          >
            Chat
          </button>
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === "profile"}
            onClick={() => setTab("profile")}
          >
            About me
          </button>
        </nav>

        <div className={`chat-body ${tab !== "chat" ? "is-hidden" : ""}`}>
        <div className="log" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role} ${m.error ? "error" : ""}`}>
              <p>{m.text}</p>
              {m.instant && <span className="tag">Instant answer</span>}
              {m.error && m.retry && (
                <button
                  type="button"
                  className="retry"
                  onClick={() => send(m.retry, true)}
                  disabled={loading}
                >
                  Try again
                </button>
              )}
            </div>
          ))}

          {!started && suggestions.length > 0 && (
            <div className="welcome">
              <p className="chips-label">Try asking</p>
              <div className="welcome-chips">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="chip"
                    onClick={() => send(q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="msg assistant">
              <p className="dots" aria-label="Thinking">
                <span />
                <span />
                <span />
              </p>
              {slow && (
                <p className="slow-note">
                  This is taking longer than usual. The server may be waking up.
                </p>
              )}
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {started && suggestions.length > 0 && (
          <div className="chips-row" aria-label="Suggested questions">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                className="chip"
                onClick={() => send(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything…"
            maxLength={500}
            aria-label="Your question"
            autoComplete="off"
          />
          {canListen && (
            <button
              type="button"
              className={`icon-btn ${listening ? "on" : ""}`}
              onClick={toggleMic}
              aria-label={listening ? "Stop listening" : "Speak your question"}
              title="Speak your question"
            >
              🎤
            </button>
          )}
          <button type="submit" className="send" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
        </div>

        {tab === "profile" && (
          <ProfilePanel
            onAsk={(question) => {
              setTab("chat");
              send(question);
            }}
          />
        )}
      </section>
    </main>
  );
}
