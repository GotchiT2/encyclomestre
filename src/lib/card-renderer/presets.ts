import { presetDefinition, validateDefinition, type Theme } from "./definition";
import {
  emptyFinish,
  parseZoneCss,
  type Surface,
  type Finish,
  type Zone,
  type Layout,
} from "./layout";
export const modelPresets = [
  {
    id: "neon-tokyo",
    theme: "cyberpunk",
    color: "#42eeff",
    second: "#ff42bd",
    background: "#091421",
    pattern: "lines",
    font: "mono",
    finish: "neon",
    title: "bottom",
  },
  {
    id: "green-terminal",
    theme: "cyberpunk",
    color: "#68ff88",
    second: "#1a743e",
    background: "#040c08",
    pattern: "lines",
    font: "mono",
    finish: "neon",
    title: "bottom",
  },
  {
    id: "orbit",
    theme: "space",
    color: "#98c6ff",
    second: "#917cff",
    background: "#0c1732",
    pattern: "dots",
    font: "sans",
    finish: "holographic",
    title: "bottom",
  },
  {
    id: "aurora",
    theme: "space",
    color: "#7cf4d9",
    second: "#be7af5",
    background: "#10213c",
    pattern: "waves",
    font: "sans",
    finish: "prismatic",
    title: "bottom",
  },
  {
    id: "comics-pop",
    theme: "comics",
    color: "#ffdd3c",
    second: "#f24376",
    background: "#181617",
    pattern: "dots",
    font: "sans",
    finish: "none",
    title: "bottom",
  },
  {
    id: "mono-manga",
    theme: "comics",
    color: "#fff6df",
    second: "#88857b",
    background: "#101010",
    pattern: "lines",
    font: "sans",
    finish: "none",
    title: "bottom",
  },
  {
    id: "sakura",
    theme: "japanese",
    color: "#efb7cb",
    second: "#d6b87c",
    background: "#372236",
    pattern: "waves",
    font: "serif",
    finish: "metallic",
    title: "bottom",
  },
  {
    id: "imperial-indigo",
    theme: "japanese",
    color: "#d4b477",
    second: "#d44738",
    background: "#171d40",
    pattern: "waves",
    font: "serif",
    finish: "metallic",
    title: "bottom",
  },
  {
    id: "sports-chrome",
    theme: "classic",
    color: "#ccdce8",
    second: "#578ab5",
    background: "#102235",
    pattern: "lines",
    font: "sans",
    finish: "metallic",
    title: "bottom",
  },
  {
    id: "black-gold",
    theme: "classic",
    color: "#d7b465",
    second: "#a27732",
    background: "#101010",
    pattern: "none",
    font: "serif",
    finish: "metallic",
    title: "bottom",
  },
  {
    id: "art-deco",
    theme: "japanese",
    color: "#d9c197",
    second: "#f5eedb",
    background: "#111919",
    pattern: "lines",
    font: "serif",
    finish: "metallic",
    title: "bottom",
  },
  {
    id: "pastel-holo",
    theme: "kawaii",
    color: "#ffbde8",
    second: "#adf4d8",
    background: "#453755",
    pattern: "dots",
    font: "sans",
    finish: "holographic",
    title: "bottom",
  },
] as const;
export type PresetId = (typeof modelPresets)[number]["id"];
export const initialPresets: PresetId[] = [
  "neon-tokyo",
  "orbit",
  "comics-pop",
  "sakura",
  "sports-chrome",
  "pastel-holo",
];
/** Gallery metadata is never interpreted by the renderer. All appearances are explicit v2 values. */
export function galleryDefinition(id: string) {
  const spec = modelPresets.find((p) => p.id === id);
  if (!spec) throw new Error("UNKNOWN_PRESET");
  const d = presetDefinition(spec.theme as Theme);
  d.visual.color = spec.color;
  d.visual.cartouche = spec.background;
  d.visual.radius = 0;
  d.visual.border = spec.theme === "comics" ? 3 : 1;
  d.visual.align = ["sports-chrome", "art-deco"].includes(id)
    ? "center"
    : "left";
  d.design.secondary = spec.second;
  d.design.pattern = spec.pattern;
  d.design.font = spec.font;
  d.design.titlePosition = spec.title;
  d.design.titleWidth = 88;
  d.design.weight =
    spec.theme === "comics" || id === "sports-chrome" ? 900 : 600;
  d.design.serialFinish = [
    "sakura",
    "imperial-indigo",
    "black-gold",
    "art-deco",
  ].includes(id)
    ? "gold"
    : "silver";
  const l = d.layout!;
  l.zones.frame.background = spec.background;
  l.zones.inner.borderColor = spec.color;
  l.zones.inner.borderStyle = [
    "art-deco",
    "sports-chrome",
    "neon-tokyo",
  ].includes(id)
    ? "double"
    : "solid";
  l.zones.inner.borderWidth =
    l.zones.inner.borderStyle === "double" ? 1.5 : 0.5;
  l.zones.title.background = spec.background + "ed";
  l.zones.title.borderColor = spec.color;
  l.zones.title.css = `color:${spec.color};letter-spacing:${spec.font === "mono" ? ".08em" : ".02em"}`;
  l.frameFinish = {
    ...emptyFinish(),
    type: spec.finish,
    color: spec.color,
    second: spec.second,
    intensity: spec.finish === "neon" ? 70 : 35,
    motion: "pointer",
    width: 3,
  };
  if (id === "comics-pop") {
    l.zones.title.background = spec.color;
    l.zones.title.css = "color:#161616;text-transform:uppercase";
    l.titleTilt = -3;
  }
  if (id === "mono-manga")
    l.zones.decor.css =
      "background-image:repeating-linear-gradient(135deg,transparent 0 7px,#ffffff22 7px 8px)";
  if (id === "aurora")
    l.zones.title.css +=
      ";background-image:linear-gradient(135deg,#10213ce6,#73489ecc)";
  if (id === "art-deco") {
    l.ornament = "stripes";
    l.zones.title.borderStyle = "double";
    l.zones.title.borderWidth = 1.5;
  }
  if (id === "green-terminal") {
    l.ornament = "circuit";
    l.zones.title.css += ";text-transform:uppercase";
  }
  return validateDefinition(d);
}
export type StyleGroup = "border" | "fill" | "finish";
export interface ZoneStyle {
  id: string;
  group: StyleGroup;
  surface?: Partial<Surface>;
  finish?: Finish;
  css?: string;
  swatch: string;
}
const border = (
  id: string,
  color: string,
  width: number,
  style: Surface["borderStyle"] = "solid",
  css = "",
): ZoneStyle => ({
  id,
  group: "border",
  surface: {
    borderColor: color,
    borderWidth: width,
    borderStyle: style,
    shadow: 0,
  },
  css,
  swatch: `border:${Math.max(1, width * 2)}px ${style} ${color};${css}`,
});
const fill = (id: string, background: string, css = ""): ZoneStyle => ({
  id,
  group: "fill",
  surface: { background },
  css,
  swatch: `background:${background};${css}`,
});
const finish = (
  id: string,
  type: Finish["type"],
  patch: Partial<Finish> = {},
): ZoneStyle => ({
  id,
  group: "finish",
  finish: { ...emptyFinish(), type, ...patch },
  swatch: `background:linear-gradient(120deg,${patch.color ?? "#6cecff"},#182638,${patch.second ?? "#f695e3"});${type === "neon" ? "box-shadow:inset 0 0 10px #6cecff" : ""}`,
});
export const zoneStyles: ZoneStyle[] = [
  border("fine", "#ced9e2", 0.4),
  border("double", "#9ec8de", 1.5, "double"),
  border("ink", "#101010", 3),
  border("technical", "#67dcfa", 1, "dashed"),
  border(
    "silver",
    "#dce4ee",
    1,
    "double",
    "box-shadow:inset 0 0 1cqw #ffffff,0 0 .5cqw #7893a5",
  ),
  border("gold", "#d9b65b", 1, "solid", "box-shadow:inset 0 0 1cqw #f9d987"),
  border(
    "engraved",
    "#83909e",
    1,
    "double",
    "box-shadow:inset .5cqw .5cqw 1cqw #000000",
  ),
  border(
    "neon",
    "#60efff",
    0.8,
    "solid",
    "box-shadow:0 0 3cqw #38dfff,inset 0 0 2cqw #38dfff",
  ),
  // #00000000 is the legacy automatic cartouche sentinel. White at zero alpha
  // expresses actual transparency without changing old saved definitions.
  fill("clear", "#ffffff00"),
  fill("matte", "#101218"),
  fill("ivory", "#f4eedc"),
  fill(
    "night",
    "#10172e",
    "background-image:linear-gradient(135deg,#090d20,#293e6b)",
  ),
  fill(
    "pastel",
    "#efd5ed",
    "background-image:linear-gradient(135deg,#f6cee9,#b8ecdd)",
  ),
  fill(
    "brushed",
    "#788897",
    "background-image:repeating-linear-gradient(0deg,#ffffff22 0 1px,#00000011 1px 3px)",
  ),
  fill(
    "print",
    "#e7bd54",
    "background-image:radial-gradient(#00000066 1px,transparent 1px);background-size:5px 5px",
  ),
  fill("smoke", "#111827c9"),
  finish("off", "none"),
  finish("satin", "metallic", { intensity: 22, motion: "static" }),
  finish("sweep", "metallic", { intensity: 60, motion: "pointer", width: 6 }),
  finish("soft-holo", "holographic", { intensity: 30 }),
  finish("prism", "prismatic", { intensity: 55, scale: 12 }),
  finish("sparkle", "glitter", { intensity: 40, scale: 8 }),
  finish("neon-static", "neon", { intensity: 75 }),
  finish("neon-pulse", "neon", { intensity: 70, motion: "animated", speed: 5 }),
];
export const finishKeyFor = (zone: Zone) =>
  zone === "frame"
    ? "frameFinish"
    : zone === "image"
      ? "imageFinish"
      : zone === "decor"
        ? "decorFinish"
        : null;
export function compatibleStyle(style: ZoneStyle, zone: Zone) {
  return style.group !== "finish" || !!finishKeyFor(zone);
}
/** Replace only declarations that conflict with the selected property group. */
export function applyZoneStyle(layout: Layout, zone: Zone, style: ZoneStyle) {
  if (!compatibleStyle(style, zone)) throw new Error("INCOMPATIBLE_ZONE");
  const next: Layout = JSON.parse(JSON.stringify(layout));
  const removed: string[] = [];
  if (style.group === "finish")
    next[finishKeyFor(zone)!] = { ...style.finish! };
  else {
    const parts = parseZoneCss(next.zones[zone].css).split(";").filter(Boolean);
    const kept = parts.filter((part) => {
      const key = part.split(":")[0];
      const conflicts =
        style.group === "border"
          ? key.startsWith("border-") || key === "box-shadow"
          : key === "background" || key.startsWith("background-");
      if (conflicts) removed.push(key);
      return !conflicts;
    });
    next.zones[zone] = {
      ...next.zones[zone],
      ...style.surface,
      css: [...kept, style.css ?? ""].filter(Boolean).join(";"),
    };
  }
  return { layout: next, removed: [...new Set(removed)] };
}
