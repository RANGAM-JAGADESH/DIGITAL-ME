"use client";

import { useEffect, useState } from "react";
import { profile } from "../data/profile";

// "About me" tab: animated hero and stats, conversation starters, education journey, skills,
// filterable projects, what I'm exploring, how I work, certifications and links.
// Anything with an "Ask" button jumps to the chat and asks the avatar.

function CountUp({ value, decimals = 0 }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return undefined;
    }
    let frame;
    let start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 1000, 1);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{n.toFixed(decimals)}</>;
}

const CATEGORIES = ["All", ...Array.from(new Set(profile.projects.map((p) => p.category)))];

export default function ProfilePanel({ onAsk }) {
  const [filter, setFilter] = useState("All");
  const shown = profile.projects.filter((p) => filter === "All" || p.category === filter);

  return (
    <div className="profile">
      <header className="hero">
        <p className="hero-hello">Hi, I&apos;m</p>
        <h2>
          {profile.name} <span className="hero-nick">“{profile.nickname}”</span>
        </h2>
        <p className="headline">{profile.headline}</p>
        <p className="profile-summary">{profile.summary}</p>

        <div className="facts">
          {profile.facts.map((f) => (
            <div key={f.label} className="fact">
              <b>{f.text ? f.text : <CountUp value={f.value} decimals={f.decimals || 0} />}</b>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="starters">
          <span className="chips-label">Start a conversation</span>
          <div className="welcome-chips">
            {profile.starters.map((q) => (
              <button key={q} type="button" className="chip" onClick={() => onAsk(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section>
        <h3>Journey</h3>
        <ul className="timeline">
          {profile.education.map((e) => (
            <li key={e.what}>
              <div className="when">{e.when}</div>
              <div className="what">{e.what}</div>
              {e.detail && <div className="detail">{e.detail}</div>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Skills</h3>
        {profile.skills.map((s) => (
          <div key={s.group} className="skill-group">
            <p>{s.group}</p>
            <div className="pills">
              {s.items.map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h3>Projects</h3>
        <div className="filters" role="group" aria-label="Filter projects">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="filter"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="project-grid">
          {shown.map((p, i) => (
            <article key={p.name} className="project fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="project-cat">{p.category}</span>
              <h4>{p.name}</h4>
              <p>{p.summary}</p>
              <div className="pills">
                {p.tech.map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
              </div>
              <button type="button" className="ask-btn" onClick={() => onAsk(p.ask)}>
                Ask about this
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Currently exploring</h3>
        <div className="pills explore">
          {profile.exploring.items.map((item) => (
            <span key={item} className="pill pill-accent">
              {item}
            </span>
          ))}
        </div>
        <button type="button" className="ask-btn explore-ask" onClick={() => onAsk(profile.exploring.ask)}>
          Ask what I&apos;m learning
        </button>
      </section>

      <section>
        <h3>How I work</h3>
        <div className="approach-grid">
          {profile.approach.map((a) => (
            <div key={a.title} className="approach">
              <h4>{a.title}</h4>
              <p>{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Certifications</h3>
        <ul className="plain-list">
          {profile.certifications.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Find me online</h3>
        <div className="links">
          {profile.links.map((l) => (
            <a key={l.label} className="link-btn" href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label} ↗
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
