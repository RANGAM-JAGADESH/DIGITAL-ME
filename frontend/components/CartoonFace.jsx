import { LOOK } from "../data/look";

// Emotion settings: brows, eyes, smile, blush, head tilt and where the eyes look.
// browL / browR = vertical shift (negative = raised). tilt > 0 raises the inner ends (soft/worried),
// tilt < 0 lowers them (serious). smile > 0 lifts the mouth corners, < 0 turns them down.
export const EMOTIONS = {
  neutral:    { label: "Calm",       browL: 0,   browR: 0,   tilt: 0,  eye: "open",   ry: 12, smile: 10, cheeks: 0.15, head: 0,  gaze: [0, 0] },
  happy:      { label: "Happy",      browL: -4,  browR: -4,  tilt: 3,  eye: "smile",  ry: 12, smile: 18, cheeks: 0.55, head: 2,  gaze: [0, 0] },
  excited:    { label: "Excited",    browL: -11, browR: -11, tilt: 4,  eye: "wide",   ry: 15, smile: 20, cheeks: 0.5,  head: 0,  gaze: [0, -1] },
  thoughtful: { label: "Thoughtful", browL: -1,  browR: -10, tilt: 2,  eye: "open",   ry: 12, smile: 1,  cheeks: 0,    head: -4, gaze: [6, -5] },
  serious:    { label: "Serious",    browL: 3,   browR: 3,   tilt: -8, eye: "narrow", ry: 9,  smile: -3, cheeks: 0,    head: 0,  gaze: [0, 1] },
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
const MY_DEFAULT = 278; // mouth line (lower when there is a mustache)

const OPEN = 2.0; // quadratic curves only reach about half their control offset

function mouthPath(w, s, o, MY) {
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
  const irisR = mode === "wide" ? 13.5 : 12.5;
  return (
    <g>
      <ellipse cx={x} cy={y} rx="23" ry={ry + 2.5} fill="#ffffff" />
      <circle cx={x + gx} cy={y + gy} r={irisR} fill={look.eyes} />
      <circle cx={x + gx} cy={y + gy} r="6" fill="#0d0907" />
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
  const MY = look.mustache ? MY_DEFAULT + 8 : MY_DEFAULT;
  const mouth = round
    ? `M ${CX - 14} ${MY + 9} A 14 17 0 1 0 ${CX + 14} ${MY + 9} A 14 17 0 1 0 ${CX - 14} ${MY + 9} Z`
    : mouthPath(v.w, smile, v.o, MY);
  const gz = [gaze[0] + e.gaze[0], gaze[1] + e.gaze[1]];
  const lift = look.glasses ? -6 : 0; // brows stay above the frames

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
        {look.necklace && (
          <g>
            <path d="M 172 352 Q 200 432 228 352" stroke="#c4cbd6" strokeWidth="2.4" fill="none" />
            <circle cx="200" cy="394" r="5.5" fill="#dfe4ec" stroke="#8d96a3" strokeWidth="2" />
          </g>
        )}
      </g>

      <g className="head-sway">
        <g className="head-tilt" style={{ transform: `rotate(${e.head}deg)` }}>
          {/* ears */}
          <ellipse cx="102" cy="214" rx="13" ry="23" fill={look.skinShade} />
          <ellipse cx="298" cy="214" rx="13" ry="23" fill={look.skinShade} />
          <path d="M 104 204 Q 99 214 105 226" stroke={look.skinDeep} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 296 204 Q 301 214 295 226" stroke={look.skinDeep} strokeWidth="3" fill="none" strokeLinecap="round" />

          {look.earring && (
            <g>
              <circle cx="103" cy="237" r="4" fill="#dfe4ec" stroke="#8d96a3" strokeWidth="1.5" />
            </g>
          )}

          {/* face */}
          <path
            d="M 106 206 C 106 120 150 92 200 92 C 250 92 294 120 294 206 C 294 274 256 322 200 322 C 144 322 106 274 106 206 Z"
            fill="url(#dm-face)"
          />
          {/* soft jaw shadow */}
          <path
            d="M 126 262 C 140 300 168 322 200 322 C 232 322 260 300 274 262 C 262 296 236 312 200 312 C 164 312 138 296 126 262 Z"
            fill={look.skinDeep}
            opacity="0.08"
          />

          {/* short trimmed beard along the jaw and chin */}
          {look.beard && (
            <path
              d="M 108 240 C 114 288 152 322 200 322 C 248 322 286 288 292 240 C 284 266 268 288 244 297 C 232 303 218 302 200 304 C 182 302 168 303 156 297 C 132 288 116 266 108 240 Z"
              fill={look.hair}
              opacity={look.beardOpacity ?? 0.88}
            />
          )}

          {/* soft shadow under the fringe */}
          <path d="M 126 150 C 150 172 188 172 200 160 C 212 172 250 172 274 150 C 262 140 240 136 200 138 C 160 136 138 140 126 150 Z" fill={look.skinDeep} opacity="0.1" />

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
            style={{ transform: `translateY(${e.browL + lift}px) rotate(${-e.tilt}deg)`, transformOrigin: "160px 172px", transition: "transform .3s" }}
          />
          <path
            d="M 214 174 Q 240 163 266 176"
            stroke={look.hair}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
            style={{ transform: `translateY(${e.browR + lift}px) rotate(${e.tilt}deg)`, transformOrigin: "240px 172px", transition: "transform .3s" }}
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

          {/* mustache */}
          {look.mustache && (
            <g>
              <path
                d="M 200 262 C 192 257 178 257 168 262 C 160 266 158 274 161 280 C 168 275 176 271 186 270 C 192 269 197 270 200 271 C 203 270 208 269 214 270 C 224 271 232 275 239 280 C 242 274 240 266 232 262 C 222 257 208 257 200 262 Z"
                fill={look.hair}
              />
              <path d="M 174 263 C 182 259 190 260 197 263" stroke={look.hairShine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
              <path d="M 226 263 C 218 259 210 260 203 263" stroke={look.hairShine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
            </g>
          )}

          {/* hair */}
          {look.hairStyle === "short" ? (
            <>
              <path
                d="M 94 218 C 80 116 132 54 202 54 C 272 54 322 116 306 218 C 302 178 288 150 262 136 C 240 154 188 154 150 130 C 126 150 108 180 94 218 Z"
                fill={look.hair}
              />
              <path d="M 156 84 C 190 68 236 70 266 94" stroke={look.hairShine} strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.45" />
              <path d="M 138 104 C 150 94 166 88 180 86" stroke={look.hairShine} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.3" />
            </>
          ) : (
          <g transform="translate(200 224) scale(0.95 0.9) translate(-200 -224)">
          <path
            d="M 92 224 C 70 180 72 130 96 102 C 100 76 124 56 152 54 C 164 38 196 32 220 42 C 248 34 278 50 288 76 C 314 90 330 126 322 164 C 328 192 318 212 308 226 C 300 190 296 166 278 144 C 262 124 238 114 214 116 C 204 112 186 116 172 126 C 150 130 132 144 122 164 C 116 180 112 200 106 224 C 100 228 96 228 92 224 Z"
            fill={look.hair}
          />
          {/* curls and shine */}
          <path d="M 122 90 C 136 72 158 68 172 76" stroke={look.hairShine} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M 192 48 C 212 42 234 48 244 60" stroke={look.hairShine} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M 262 76 C 282 76 296 90 298 108" stroke={look.hairShine} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M 98 132 C 90 150 92 170 100 186" stroke={look.hairShine} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.35" />
          <path d="M 170 100 C 190 90 214 92 226 104" stroke={look.hairShine} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.35" />
          <path d="M 234 98 C 252 94 270 102 278 118" stroke={look.hairShine} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.3" />

          </g>
          )}

          {/* optional glasses */}
          {look.glasses && (
            <g fill="none" stroke={look.glassesColor} strokeWidth={look.glassesWeight ?? 5} strokeLinejoin="round" strokeLinecap="round">
              <rect x="127" y="180" width="66" height="46" rx="18" fill="#ffffff" fillOpacity="0.08" />
              <rect x="207" y="180" width="66" height="46" rx="18" fill="#ffffff" fillOpacity="0.08" />
              <path d="M 193 196 Q 200 190 207 196" />
              <path d="M 127 195 L 106 190" />
              <path d="M 273 195 L 294 190" />
              <path d="M 136 190 Q 142 186 152 186" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="3" />
              <path d="M 216 190 Q 222 186 232 186" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="3" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
