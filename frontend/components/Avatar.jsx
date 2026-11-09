"use client";

import { useEffect, useRef, useState } from "react";
import CartoonFace, { EMOTIONS } from "./CartoonFace";

// Avatar stage. Shows a saved video when one exists; otherwise the animated cartoon,
// which blinks, looks around, changes expression with the answer's emotion and moves
// its mouth while speech is playing.

const SPEECH_SHAPES = ["a", "e", "o", "m", "a", "e", "closed"];

export default function Avatar({ videoUrl, speaking, emotion, status, onVideoPlay, onVideoEnd }) {
  const mood = EMOTIONS[emotion] ? emotion : "neutral";
  const [blink, setBlink] = useState(false);
  const [gaze, setGaze] = useState([0, 0]);
  const [viseme, setViseme] = useState("closed");
  const lastShape = useRef("closed");

  // blinking at natural, irregular intervals
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 140);
      }, 2400 + Math.random() * 3200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // small eye movements so the face never looks frozen
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setGaze([Math.round((Math.random() - 0.5) * 6), Math.round((Math.random() - 0.5) * 4)]);
        schedule();
      }, 2200 + Math.random() * 2600);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // mouth shapes while speaking (never the same shape twice in a row)
  useEffect(() => {
    if (!speaking) {
      setViseme(mood === "excited" ? "grin" : "closed");
      return undefined;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer;
    const next = () => {
      let shape;
      do {
        shape = SPEECH_SHAPES[Math.floor(Math.random() * SPEECH_SHAPES.length)];
      } while (shape === lastShape.current);
      lastShape.current = shape;
      setViseme(shape);
      timer = setTimeout(next, reduce ? 320 : 95 + Math.random() * 70);
    };
    next();
    return () => clearTimeout(timer);
  }, [speaking, mood]);

  return (
    <div
      className={`avatar ${videoUrl ? "has-video" : ""} ${speaking ? "is-speaking" : ""}`}
      data-emotion={mood}
    >
      {videoUrl ? (
        <video
          className="avatar-video"
          src={videoUrl}
          autoPlay
          playsInline
          onPlay={onVideoPlay}
          onEnded={onVideoEnd}
          onPause={onVideoEnd}
        />
      ) : (
        <div className="avatar-card">
          <CartoonFace emotion={mood} viseme={viseme} blink={blink} gaze={gaze} speaking={speaking} />
          <span className="mood-badge">
            <i className="mood-dot" />
            {EMOTIONS[mood].label}
          </span>
        </div>
      )}
      <span className="status">{status}</span>
    </div>
  );
}
