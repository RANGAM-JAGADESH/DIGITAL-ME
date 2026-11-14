// How the cartoon avatar looks. Pick a preset at the bottom, or edit the colours (hex codes).
// glasses, mustache, beard, earring and necklace are on/off switches (true or false).

// The original friendly look: short black hair, navy sweater
export const CLASSIC = {
  hairStyle: "short",
  skin: "#d99a6c",
  skinShade: "#c07f50",
  skinDeep: "#a56a3c",
  hair: "#1b181d",
  hairShine: "#4b4452",
  eyes: "#3a2316",
  shirt: "#2f4a8a",
  shirtDark: "#243a70",
  collar: "#e8eefc",
  glasses: false,
  glassesColor: "#222838",
  glassesWeight: 3.8,
  mustache: false,
  beard: false,
  beardOpacity: 0.34,
  earring: false,
  necklace: false,
};

// Closer to the photo: wavy hair, light stubble, mustache, glasses, earring, chain, white T-shirt
export const PERSONAL = {
  hairStyle: "wavy",
  skin: "#cc9066",
  skinShade: "#b07a50",
  skinDeep: "#946040",
  hair: "#17151c",
  hairShine: "#43405a",
  eyes: "#2b1a12",
  shirt: "#eef0f5",
  shirtDark: "#cdd3df",
  collar: "#dde2ea",
  glasses: true,
  glassesColor: "#222838",
  glassesWeight: 3.8,
  mustache: true,
  beard: true,
  beardOpacity: 0.34,
  earring: true,
  necklace: true,
};

// The avatar uses this one. Change CLASSIC to PERSONAL to switch.
// Want the classic look with glasses? Set glasses: true inside CLASSIC.
export const LOOK = CLASSIC;
