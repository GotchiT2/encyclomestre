export const zones = [
  "frame",
  "inner",
  "image",
  "decor",
  "title",
  "serial",
  "logo",
] as const;
export type Zone = (typeof zones)[number];
export const finishes = [
  "none",
  "neon",
  "metallic",
  "holographic",
  "prismatic",
  "glitter",
] as const;
export interface Surface {
  background: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: "solid" | "double" | "dashed";
  padding: number;
  opacity: number;
  shadow: number;
  css: string;
}
export interface Finish {
  type: (typeof finishes)[number];
  color: string;
  second: string;
  intensity: number;
  width: number;
  angle: number;
  scale: number;
  motion: "static" | "pointer" | "animated";
  speed: number;
}
export interface Layout {
  zones: Record<Zone, Surface>;
  frameFinish: Finish;
  imageFinish: Finish;
  decorFinish: Finish;
  logoCorner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  logoSize: number;
  logoMargin: number;
  titleOffset: number;
  titleTilt: number;
  ornament: "none" | "orbits" | "circuit" | "stripes";
}
export const surfaceRanges = {
  borderWidth: [0, 8, 0.5],
  padding: [0, 8, 0.5],
  opacity: [0, 100, 1],
  shadow: [0, 20, 1],
} as const;
export const finishRanges = {
  intensity: [0, 100, 1],
  width: [1, 15, 0.5],
  angle: [0, 360, 1],
  scale: [4, 60, 1],
  speed: [2, 20, 1],
} as const;
export function emptyFinish(): Finish {
  return {
    type: "none",
    color: "#6cecff",
    second: "#f695e3",
    intensity: 35,
    width: 3,
    angle: 120,
    scale: 18,
    motion: "static",
    speed: 8,
  };
}
const allowed = new Set([
  "background",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "color",
  "border-color",
  "border-width",
  "border-style",
  "border-top-color",
  "border-bottom-color",
  "border-left-color",
  "border-right-color",
  "box-shadow",
  "text-shadow",
  "font-weight",
  "font-size",
  "font-style",
  "font-family",
  "letter-spacing",
  "line-height",
  "text-align",
  "text-transform",
  "padding",
  "padding-inline",
  "padding-block",
  "opacity",
]);
/** Only declarations on a single owned element, never selectors or resource-bearing values. */
export function parseZoneCss(raw: string): string {
  if (
    typeof raw !== "string" ||
    raw.length > 4000 ||
    /[{}@\\<>]|url\s*\(|var\s*\(|env\s*\(|expression|!important|image-set|\/\*/i.test(
      raw,
    )
  )
    throw new Error("INVALID_ZONE_CSS");
  const result: string[] = [];
  for (const declaration of raw.split(";").filter((s) => s.trim())) {
    const split = declaration.indexOf(":");
    const key = declaration.slice(0, split).trim().toLowerCase(),
      value = declaration.slice(split + 1).trim();
    if (
      split < 1 ||
      !allowed.has(key) ||
      !value ||
      !/^[a-zA-Z0-9#(),.%+\-\s'"/]+$/.test(value)
    )
      throw new Error("INVALID_ZONE_CSS");
    if (
      key === "font-family" &&
      !/^(serif|sans-serif|monospace|Georgia|Inter)$/i.test(value)
    )
      throw new Error("INVALID_ZONE_CSS");
    result.push(key + ":" + value);
  }
  return result.join(";");
}
export function surfaceCss(s: Surface) {
  return `background:${s.background};border:${s.borderWidth}cqw ${s.borderStyle} ${s.borderColor};padding:${s.padding}cqw;opacity:${s.opacity / 100};box-shadow:${s.shadow ? `0 ${s.shadow / 3}cqw ${s.shadow}cqw #0008` : "none"};${parseZoneCss(s.css)}`;
}
export function defaultLayout(theme = "classic"): Layout {
  const surface = (): Surface => ({
    background: "#00000000",
    borderColor: "#ffffff",
    borderWidth: 0,
    borderStyle: "solid",
    padding: 0,
    opacity: 100,
    shadow: 0,
    css: "",
  });
  const z = Object.fromEntries(
    zones.map((zone) => [zone, surface()]),
  ) as Record<Zone, Surface>;
  z.frame.background = "#f5f0e5";
  z.inner.borderWidth = 0.5;
  z.title.padding = 3;
  z.title.borderWidth = 0.5;
  z.serial.padding = 1;
  z.serial.borderWidth = 0.5;
  const l: Layout = {
    zones: z,
    frameFinish: emptyFinish(),
    imageFinish: emptyFinish(),
    decorFinish: emptyFinish(),
    logoCorner: "top-right",
    logoSize: 13,
    logoMargin: 5,
    titleOffset: 0,
    titleTilt: 0,
    ornament: "none",
  };
  if (theme === "cyberpunk") {
    z.frame.background = "#0b1020";
    z.inner.borderColor = "#3ee8eb";
    z.inner.borderStyle = "double";
    z.inner.borderWidth = 1.5;
    z.title.borderColor = "#ef47bd";
    z.title.shadow = 3;
    l.ornament = "circuit";
    l.frameFinish = {
      ...emptyFinish(),
      type: "neon",
      motion: "animated",
      intensity: 65,
    };
  }
  if (theme === "space") {
    z.frame.background = "#0b1428";
    z.frame.css =
      "background: radial-gradient(ellipse at 80% 10%, #49366d, #0b1428 65%)";
    z.inner.borderColor = "#bca7ff";
    z.title.borderColor = "#bca7ff";
    z.title.shadow = 5;
    l.ornament = "orbits";
    l.frameFinish = { ...emptyFinish(), type: "holographic", intensity: 30 };
  }
  if (theme === "comics") {
    z.frame.background = "#ffda42";
    z.inner.borderColor = "#17171b";
    z.inner.borderWidth = 1;
    z.title.borderColor = "#17171b";
    z.title.borderWidth = 1;
    z.title.css =
      "box-shadow: 1.5cqw 1.5cqw 0 #17171b; text-transform: uppercase";
    l.titleTilt = -3;
  }
  if (theme === "kawaii") {
    z.frame.background = "#ffc2da";
    z.inner.borderStyle = "double";
    z.inner.borderWidth = 2;
    z.title.borderColor = "#ea9bbc";
    z.title.borderStyle = "double";
    z.title.borderWidth = 1.5;
    l.imageFinish = {
      ...emptyFinish(),
      type: "glitter",
      color: "#ffc2da",
      second: "#baf6df",
      intensity: 18,
    };
  }
  if (theme === "japanese") {
    z.frame.background = "#f0e6ce";
    z.inner.borderColor = "#233952";
    z.title.borderColor = "#d6493a";
    z.title.borderWidth = 1;
    l.ornament = "stripes";
    l.frameFinish = {
      ...emptyFinish(),
      type: "metallic",
      color: "#e5c78f",
      second: "#fff0cc",
      intensity: 40,
    };
  }
  return l;
}
function color(value: unknown) {
  return (
    typeof value === "string" && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)
  );
}
function ranges(value: object, constraints: Record<string, readonly number[]>) {
  for (const [k, [min, max]] of Object.entries(constraints)) {
    const n = (value as Record<string, unknown>)[k];
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
      throw new Error("INVALID_LAYOUT");
  }
}
export function validateLayout(value: unknown): Layout {
  const l = value as Layout;
  if (!l || !l.zones) throw new Error("INVALID_LAYOUT");
  const z = {} as Record<Zone, Surface>;
  for (const zone of zones) {
    const s = l.zones[zone];
    if (
      !s ||
      !color(s.background) ||
      !color(s.borderColor) ||
      !["solid", "double", "dashed"].includes(s.borderStyle)
    )
      throw new Error("INVALID_LAYOUT");
    ranges(s, surfaceRanges);
    z[zone] = {
      background: s.background,
      borderColor: s.borderColor,
      borderWidth: s.borderWidth,
      borderStyle: s.borderStyle,
      padding: s.padding,
      opacity: s.opacity,
      shadow: s.shadow,
      css: parseZoneCss(s.css),
    };
  }
  const finish = (f: Finish): Finish => {
    if (
      !f ||
      !finishes.includes(f.type) ||
      !color(f.color) ||
      !color(f.second) ||
      !["static", "pointer", "animated"].includes(f.motion)
    )
      throw new Error("INVALID_LAYOUT");
    ranges(f, finishRanges);
    return {
      type: f.type,
      color: f.color,
      second: f.second,
      intensity: f.intensity,
      width: f.width,
      angle: f.angle,
      scale: f.scale,
      motion: f.motion,
      speed: f.speed,
    };
  };
  ranges(l, {
    logoSize: [5, 25],
    logoMargin: [2, 12],
    titleOffset: [0, 15],
    titleTilt: [-5, 5],
  });
  if (
    !["top-left", "top-right", "bottom-left", "bottom-right"].includes(
      l.logoCorner,
    ) ||
    !["none", "orbits", "circuit", "stripes"].includes(l.ornament)
  )
    throw new Error("INVALID_LAYOUT");
  return {
    zones: z,
    frameFinish: finish(l.frameFinish),
    imageFinish: finish(l.imageFinish),
    decorFinish: finish(l.decorFinish ?? emptyFinish()),
    logoCorner: l.logoCorner,
    logoSize: l.logoSize,
    logoMargin: l.logoMargin,
    titleOffset: l.titleOffset,
    titleTilt: l.titleTilt,
    ornament: l.ornament,
  };
}
