import { LOOK } from "../data/look";

// Emotion settings: brows, eyes, smile, blush, head tilt and where the eyes look.
// browL / browR = vertical shift (negative = raised). tilt > 0 raises the inner ends (soft/worried),
// tilt < 0 lowers them (serious). smile > 0 lifts the mouth corners, < 0 turns them down.
export const EMOTIONS = {
  neutral:    { label: "Calm",     browL: 0,   browR: 0,   tilt: 0,  eye: "open",   ry: 12, smile: 7,  cheeks: 0,    head: 0,  gaze: [0, 0] },
  happy:      { label: "Happy",    browL: -4,  browR: -4,  tilt: 3,  eye: "smile",  ry: 12, smile: 18, cheeks: 0.55, head: 2,  gaze: [0, 0] },
  excited:    { label: "Excited",  browL: -11, browR: -11, tilt: 4,  eye: "wide",   ry: 15, smile: 20, cheeks: 0.5,  head: 0,  gaze: [0, -1] },
  thoughtful: { label: "Thinking", browL: -1,  browR: -10, tilt: 2,  eye: "open",   ry: 12, smile: 1,  cheeks: 0,    head: -4, gaze: [6, -5] },
  serious:    { label: "Serious",  browL: 3,   browR: 3,   tilt: -8, eye: "narrow", ry: 9,  smile: -3, cheeks: 0,    head: 0,  gaze: [0, 1] },
};

// Mouth shapes used while speaking: half-width (w) and how far the jaw opens (o)
export const VISEMES = {
  closed: { w: 26, o: 0 },
  m: { w: 22, o: 0 },
  a: { w: 28, o: 30 },
  e: { w: 35, o: 12 },
  o: { w: 15, o: 26 },
  grin: { w: 35, o: 17 },
};

const CX = 200;
const MY = 278; // mouth line

const OPEN = 2.0; // quadratic curves only reach about half their control offset

function mouthPath(w, s, o) {
  const yc = MY - s * 0.55;
  const lx = CX - w;
  const rx = CX + w;
  if (o <= 0) return `M ${lx} ${yc} Q ${CX} ${MY + s * 0.9} ${rx} ${yc}`;
  const up = MY + s * 0.25;
  const low = MY + o * OPEN + s * 0.9;
  return `M ${lx} ${yc} Q ${CX} ${up} ${rx} ${yc} Q ${CX} ${low} ${lx} ${yc} Z`;
}

function Eye({ x, y, mode, ry, blink, gaze, look }) {
  const closedPath = `M ${x - 20} ${y + 1} Q ${x} ${y + 10} ${x + 20} ${y + 1}`;
  if (blink && mode !== "smile") {
    return <path d={closedPath} stroke="#2a1b14" strokeWidth="4" strokeLinecap="round" fill="none" />;
  }
  if (mode === "smile") {
    return (
      <path
        d={`M ${x - 20} ${y + 5} Q ${x} ${y - 15} ${x + 20} ${y + 5}`}
        stroke="#2a1b14"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  const gx = Math.max(-7, Math.min(7, gaze[0]));
  const gy = Math.max(-5, Math.min(5, gaze[1]));
  const irisR = mode === "wide" ? 13 : 12;
  return (
    <g>
      <ellipse cx={x} cy={y} rx="22" ry={ry + 1.5} fill="#ffffff" />
      <circle cx={x + gx} cy={y + gy} r={irisR} fill={look.eyes} />
      <circle cx={x + gx} cy={y + gy} r="5.8" fill="#0d0907" />
      <circle cx={x + gx - 3.5} cy={y + gy - 3.5} r="3.6" fill="#ffffff" />
      <circle cx={x + gx + 3.5} cy={y + gy + 3.5} r="1.6" fill="#ffffff" opacity="0.8" />
      {/* upper lid */}
      <path
        d={`M ${x - 23} ${y - 1} Q ${x} ${y - ry - (mode === "narrow" ? 4 : 8)} ${x + 23} ${y - 1}`}
        stroke="#2a1b14"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      {mode === "narrow" && (
        <path
          d={`M ${x - 22} ${y - 11} L ${x + 22} ${y - 11} L ${x + 22} ${y - 4} Q ${x} ${y - 8} ${x - 22} ${y - 4} Z`}
          fill={look.skin}
          opacity="0.9"
        />
      )}
    </g>
  );
}

export default function CartoonFace({
  emotion = "neutral",
  viseme = "closed",
  blink = false,
  gaze = [0, 0],
  look = LOOK,
  speaking = false,
}) {
  const e = EMOTIONS[emotion] || EMOTIONS.neutral;
  const v = VISEMES[viseme] || VISEMES.closed;
  // while speaking, keep part of the emotion's smile so the face stays expressive
  const smile = speaking ? e.smile * 0.55 : e.smile;
  const open = v.o > 0;
  const round = viseme === "o"; // "oh" is a round mouth, not a lens shape
  const mouth = round
    ? `M ${CX - 14} ${MY + 9} A 14 17 0 1 0 ${CX + 14} ${MY + 9} A 14 17 0 1 0 ${CX - 14} ${MY + 9} Z`
    : mouthPath(v.w, smile, v.o);
  const gz = [gaze[0] + e.gaze[0], gaze[1] + e.gaze[1]];

  return (
    <svg viewBox="0 0 400 460" role="img" aria-label={`Cartoon avatar of Jagadesh, ${e.label.toLowerCase()}`}>
      <defs>
        <radialGradient id="dm-face" cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor={look.skin} />
          <stop offset="0.7" stopColor={look.skin} />
          <stop offset="1" stopColor={look.skinShade} />
        </radialGradient>
        <linearGradient id="dm-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.shirt} />
          <stop offset="1" stopColor={look.shirtDark} />
        </linearGradient>
        <linearGradient id="dm-neck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.skinDeep} />
          <stop offset="1" stopColor={look.skinShade} />
        </linearGradient>
        <clipPath id="dm-mouth-clip">
          <path d={mouth} />
        </clipPath>
      </defs>

      {/* body: shoulders, neck, collar */}
      <g className="body-breathe">
        <path
          d="M 28 462 C 28 394 92 356 152 342 Q 200 376 248 342 C 308 356 372 394 372 462 Z"
          fill="url(#dm-shirt)"
        />
        <path d="M 146 344 Q 200 386 254 344 L 238 330 Q 200 362 162 330 Z" fill={look.collar} />
        <path d="M 146 344 Q 200 386 254 344" stroke={look.shirtDark} strokeWidth="2.5" fill="none" opacity="0.35" />
        <path d="M 200 372 L 200 462" stroke={look.shirtDark} strokeWidth="2.5" opacity="0.3" />
        <path d="M 96 380 Q 110 420 108 462" stroke={look.shirtDark} strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M 304 380 Q 290 420 292 462" stroke={look.shirtDark} strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M 168 296 L 168 346 Q 200 372 232 346 L 232 296 Z" fill="url(#dm-neck)" />
      </g>

      <g className="head-sway">
        <g className="head-tilt" style={{ transform: `rotate(${e.head}deg)` }}>
          {/* ears */}
          <ellipse cx="103" cy="214" rx="13" ry="23" fill={look.skinShade} />
          <ellipse cx="297" cy="214" rx="13" ry="23" fill={look.skinShade} />
          <path d="M 104 204 Q 99 214 105 226" stroke={look.skinDeep} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 296 204 Q 301 214 295 226" stroke={look.skinDeep} strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* face */}
          <path
            d="M 108 206 C 108 120 150 92 200 92 C 250 92 292 120 292 206 C 292 276 256 326 200 326 C 144 326 108 276 108 206 Z"
            fill="url(#dm-face)"
          />
          {/* soft jaw shadow */}
          <path
            d="M 126 262 C 140 300 168 322 200 322 C 232 322 260 300 274 262 C 262 296 236 312 200 312 C 164 312 138 296 126 262 Z"
            fill={look.skinDeep}
            opacity="0.18"
          />

          {/* soft shadow under the fringe */}
          <path d="M 126 150 C 150 172 188 172 200 160 C 212 172 250 172 274 150 C 262 140 240 136 200 138 C 160 136 138 140 126 150 Z" fill={look.skinDeep} opacity="0.16" />

          {/* cheeks */}
          <ellipse cx="136" cy="250" rx="21" ry="12" fill="#ff6f6f" opacity={e.cheeks} style={{ transition: "opacity .3s" }} />
          <ellipse cx="264" cy="250" rx="21" ry="12" fill="#ff6f6f" opacity={e.cheeks} style={{ transition: "opacity .3s" }} />

          {/* eyes */}
          <Eye x={160} y={202} mode={e.eye} ry={e.ry} blink={blink} gaze={gz} look={look} />
          <Eye x={240} y={202} mode={e.eye} ry={e.ry} blink={blink} gaze={gz} look={look} />

          {/* brows */}
          <path
            d="M 134 176 Q 160 163 186 174"
            stroke={look.hair}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
            style={{ transform: `translateY(${e.browL}px) rotate(${-e.tilt}deg)`, transformOrigin: "160px 172px", transition: "transform .3s" }}
          />
          <path
            d="M 214 174 Q 240 163 266 176"
            stroke={look.hair}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
            style={{ transform: `translateY(${e.browR}px) rotate(${e.tilt}deg)`, transformOrigin: "240px 172px", transition: "transform .3s" }}
          />

          {/* nose */}
          <path d="M 206 214 Q 212 240 201 249 Q 192 251 189 244" stroke={look.skinDeep} strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          <ellipse cx="203" cy="236" rx="5" ry="3" fill="#ffffff" opacity="0.12" />

          {/* mouth */}
          {open ? (
            <g>
              <path d={mouth} fill="#4a1420" />
              <g clipPath="url(#dm-mouth-clip)">
                {v.o > 10 && !round && (
                  <rect x={CX - 50} y={MY - smile * 0.55 - 3} width="100" height={Math.max(10, smile * 0.4 + 10)} rx="4" fill="#faf5ee" />
                )}
                <ellipse
                  cx={CX}
                  cy={round ? MY + 20 : MY + 0.175 * smile + v.o * OPEN * 0.42}
                  rx={round ? 9 : v.w * 0.55}
                  ry={round ? 6 : Math.max(5, v.o * 0.42)}
                  fill="#d9606f"
                />
              </g>
              <path d={mouth} stroke="#8a3b3b" strokeWidth="3" fill="none" strokeLinejoin="round" />
            </g>
          ) : (
            <path d={mouth} stroke="#8a3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}

          {/* hair */}
          <path
            d="M 94 218 C 80 116 132 54 202 54 C 272 54 322 116 306 218 C 302 178 288 150 262 136 C 240 154 188 154 150 130 C 126 150 108 180 94 218 Z"
            fill={look.hair}
          />
          <path d="M 156 84 C 190 68 236 70 266 94" stroke={look.hairShine} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d="M 138 104 C 150 94 166 88 180 86" stroke={look.hairShine} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.3" />

          {/* optional glasses */}
          {look.glasses && (
            <g stroke={look.glassesColor} strokeWidth="4" fill="none" strokeLinecap="round">
              <circle cx="160" cy="202" r="30" />
              <circle cx="240" cy="202" r="30" />
              <path d="M 190 200 Q 200 193 210 200" />
              <path d="M 130 198 L 108 192" />
              <path d="M 270 198 L 292 192" />
              <path d="M 140 186 Q 150 178 162 178" stroke="#ffffff" opacity="0.35" strokeWidth="3" />
              <path d="M 220 186 Q 230 178 242 178" stroke="#ffffff" opacity="0.35" strokeWidth="3" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
