<script lang="ts">
  import { defaultLayout, surfaceCss } from "./layout";
  import Finish from "./finish.svelte";
  import { untrack, onDestroy } from "svelte";
  import {
    landscapeFor,
    type TemplateDefinition,
    type RenderData,
  } from "./definition";
  let {
    definition,
    data,
    labels,
    onOrientationChange = () => {},
    testId = "template-card",
  }: {
    definition: TemplateDefinition;
    data: RenderData;
    labels: {
      missing: string;
      untitled: string;
    };
    onOrientationChange?: (landscape: boolean) => void;
    testId?: string;
  } = $props();
  let alive = true;
  onDestroy(() => {
    alive = false;
  });
  const p = $derived({
    ...definition.visual,
    fullArt: data.fullArt,
  });
  const d = $derived(definition.design);
  const l = $derived(definition.layout ?? defaultLayout(d.theme));
  let failed = $state(false),
    natural = $state({ width: 0, height: 0 }),
    pointer = $state(50);
  const landscape = $derived(
    landscapeFor(d.orientation, data.fullArt, natural.width, natural.height),
  );
  const serial = $derived(
    data.serial == null
      ? ""
      : data.maximum == null
        ? `#${data.serial}`
        : `${data.serial}/${data.maximum}`,
  );
  $effect(() => {
    void data.image;
    failed = false;
    natural = { width: 0, height: 0 };
  });
  $effect(() => {
    const value = landscape;
    untrack(() => onOrientationChange(value));
  });
  const ink = $derived.by(() => {
    const hex = p.cartouche.slice(1);
    const [r, g, b] = [0, 2, 4].map((offset) => {
      const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000000" : "#ffffff";
  });
  function inspect(event: Event, source: string) {
    if (source !== data.image) return;
    const img = event.currentTarget as HTMLImageElement;
    natural = { width: img.naturalWidth, height: img.naturalHeight };
  }
  function imageHandlers(source: string) {
    return {
      onload: (event: Event) => {
        if (alive) inspect(event, source);
      },
      onerror: () => {
        if (alive && source === data.image) {
          failed = true;
          natural = { width: 0, height: 0 };
        }
      },
    };
  }
  function move(event: PointerEvent) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const b = event.currentTarget as HTMLElement;
    const bounds = b.getBoundingClientRect();
    pointer = ((event.clientX - bounds.left) / bounds.width) * 100;
  }
</script>

<div
  class="canvas"
  class:landscape
  data-testid={testId}
  data-theme={d.theme}
  data-full-art={p.fullArt}
  data-orientation={landscape ? "landscape" : "portrait"}
  data-foil={l.frameFinish.type}
  data-target="frame"
  data-title={d.titlePosition}
  data-pattern={d.pattern}
  data-ornament={l.ornament}
  data-serial={d.serialPosition}
  style={`--accent:${p.color};--cartouche:${p.cartouche};--ink:${ink};--edge:${p.border}cqw;--margin:${d.margin}%;--frame-padding:${l.zones.frame.padding}cqw;--title-width:${d.titleWidth}%;--title-offset:${l.titleOffset}%;--tilt:${l.titleTilt}deg;--font:${p.fontSize}cqw;--lines:${p.lines};--align:${p.align};--position:${p.x}% ${p.y}%;--secondary:${d.secondary};--density:${d.density}px;--pattern-opacity:${d.patternOpacity / 100};--family:${d.font === "serif" ? "Georgia,serif" : d.font === "mono" ? "ui-monospace,monospace" : "Inter,sans-serif"};--weight:${d.weight};--leading:${d.lineHeight};--serial-size:${d.serialSize}cqw;--logo-size:${l.logoSize}%;--logo-margin:${l.logoMargin}%`}
  onpointermove={move}
  onpointerleave={() => (pointer = 50)}
  role="presentation"
>
  <div
    class="face"
    class:full={p.fullArt}
    data-card-zone="frame"
    style={surfaceCss(l.zones.frame)}
  >
    <div
      class="picture"
      data-card-zone="image"
      style={surfaceCss(l.zones.image)}
    >
      {#key data.image}{@const source = data.image}{#if source && !failed}<img
            src={source}
            alt=""
            class:blurred={data.blurred}
            style={`object-fit:${p.fit}`}
            loading="lazy"
            decoding="async"
            {...imageHandlers(source)}
          />{:else}<div class="missing">{labels.missing}</div>{/if}{/key}
      <Finish
        finish={l.imageFinish}
        pointer={l.imageFinish.motion === "pointer" ? pointer : 50}
      />
    </div>
    <div
      class="inner"
      data-card-zone="inner"
      style={surfaceCss(l.zones.inner)}
    ></div>
    <div class="motif" data-card-zone="decor" style={surfaceCss(l.zones.decor)}>
      <div class="pattern"></div>
      <div class="ornament"></div>
      <Finish
        finish={l.decorFinish}
        pointer={l.decorFinish.motion === "pointer" ? pointer : 50}
      />
    </div>
    <Finish
      finish={l.frameFinish}
      frame
      pointer={l.frameFinish.motion === "pointer" ? pointer : 50}
    />
    <div
      class="caption"
      data-card-zone="title"
      style={`background:${p.cartouche};${surfaceCss({ ...l.zones.title, background: l.zones.title.background === "#00000000" ? p.cartouche : l.zones.title.background })}`}
    >
      <div class="title" title={data.title}>
        {data.title || labels.untitled}
      </div>
    </div>
    <div
      class="footer"
      class:reserveLogo={!!data.boosterLogo &&
        l.logoCorner.startsWith("bottom")}
    >
      <div class="serial-slot" data-card-zone="serial">
        {#if serial}<span
            class="serial"
            data-testid="card-serial"
            style={`${surfaceCss(l.zones.serial)};${l.zones.serial.background === "#00000000" && d.serialFinish !== "plain" ? `background:linear-gradient(120deg,${d.serialFinish === "gold" ? "#d7b46d,#fff0b7,#b28a3e" : "#dce6ed,#fff,#93aaba"});color:#172030` : ""}`}
            >{serial}</span
          >{/if}
      </div>
    </div>
    <div
      class="logo-slot"
      data-card-zone="logo"
      data-corner={l.logoCorner}
      style={surfaceCss(l.zones.logo)}
    >
      {#if data.boosterLogo}<img
          src={data.boosterLogo}
          alt=""
          class="logo"
        />{/if}
    </div>
  </div>
</div>

<style>
  .canvas {
    width: 100%;
    aspect-ratio: 2.5/3.5;
    container-type: inline-size;
    isolation: isolate;
    text-align: left;
    color: #eef4ff;
  }
  .canvas.landscape {
    aspect-ratio: 3.5/2.5;
  }
  .face {
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    outline: var(--edge) solid var(--accent);
    outline-offset: calc(-1 * var(--edge));
    border-radius: 0 !important;
    padding: calc(var(--margin) + var(--frame-padding)) !important;
    gap: 2cqw;
  }
  .picture {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    z-index: 1;
    border-radius: 0 !important;
  }
  .picture img {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    object-position: var(--position);
  }
  .blurred {
    filter: blur(18px);
  }
  .missing {
    height: 100%;
    display: grid;
    place-items: center;
    background: linear-gradient(145deg, #253a48, #101820);
    font-size: 4cqw;
    color: #b7c5ce;
  }
  .inner {
    position: absolute;
    inset: var(--margin);
    pointer-events: none;
    z-index: 2;
    border-radius: 0 !important;
  }
  .motif {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
  .pattern {
    position: absolute;
    inset: 0;
    opacity: var(--pattern-opacity);
    background-size: var(--density) var(--density);
  }
  [data-pattern="lines"] .pattern {
    background-image: repeating-linear-gradient(
      45deg,
      transparent 0 45%,
      var(--secondary) 47% 50%,
      transparent 52%
    );
  }
  [data-pattern="dots"] .pattern {
    background-image: radial-gradient(
      var(--secondary) 1.4px,
      transparent 1.7px
    );
  }
  [data-pattern="waves"] .pattern {
    background-image: repeating-radial-gradient(
      circle at 50% 100%,
      transparent 0 5px,
      var(--secondary) 6px 7px,
      transparent 8px 10px
    );
  }
  .ornament {
    position: absolute;
    inset: 6%;
    opacity: var(--pattern-opacity);
  }
  [data-ornament="orbits"] .ornament {
    border: 1px solid var(--secondary);
    border-radius: 50%;
    transform: rotate(-25deg) scaleX(0.7);
    box-shadow:
      0 0 0 2cqw #ffffff18,
      0 0 0 5cqw #ffffff0a;
  }
  [data-ornament="circuit"] .ornament {
    background:
      linear-gradient(
        90deg,
        transparent 80%,
        var(--secondary) 80% 81%,
        transparent 81%
      ),
      linear-gradient(
        0deg,
        transparent 85%,
        var(--accent) 85% 86%,
        transparent 86%
      );
    border-left: 1cqw double var(--secondary);
  }
  [data-ornament="stripes"] .ornament {
    border-right: 2cqw double var(--secondary);
    border-left: 0.5cqw solid var(--secondary);
  }
  .caption {
    position: relative;
    flex: none;
    z-index: 3;
    width: var(--title-width);
    align-self: flex-start;
    color: var(--ink);
    font-family: var(--family);
    font-size: var(--font);
    font-weight: var(--weight);
    line-height: var(--leading);
    text-align: var(--align);
    margin-bottom: var(--title-offset);
    transform: rotate(var(--tilt));
    max-width: 100%;
    overflow: hidden;
  }
  .title {
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--lines);
    line-clamp: var(--lines);
    overflow: hidden;
  }
  .footer {
    height: 8cqw;
    min-height: 8cqw;
    flex: none;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    z-index: 3;
    position: relative;
  }
  .serial-slot {
    min-width: 6cqw;
    min-height: 5cqw;
    max-width: 100%;
  }
  .serial {
    display: inline-block;
    font:
      700 clamp(9px, var(--serial-size), 24px)/1.1 ui-monospace,
      monospace;
    white-space: nowrap;
    color: var(--ink);
    background: var(--cartouche);
  }
  [data-serial="left"] .footer {
    justify-content: flex-start;
  }
  .logo-slot {
    position: absolute;
    z-index: 4;
    width: var(--logo-size);
    aspect-ratio: 1;
    pointer-events: none;
    overflow: hidden;
  }
  .logo-slot[data-corner^="top"] {
    top: var(--logo-margin);
  }
  .logo-slot[data-corner^="bottom"] {
    bottom: var(--logo-margin);
  }
  .logo-slot[data-corner$="left"] {
    left: var(--logo-margin);
  }
  .logo-slot[data-corner$="right"] {
    right: var(--logo-margin);
  }
  .logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .footer.reserveLogo {
    height: calc(var(--logo-size) + var(--logo-margin));
    min-height: calc(var(--logo-size) + var(--logo-margin));
    padding-inline: calc(var(--logo-size) + 2%);
  }
  .full {
    justify-content: flex-end;
  }
  .full .picture {
    position: absolute;
    inset: 0;
  }
  .full .serial {
    color: #fff;
    background: #080e19dd;
  }
  [data-title="top"] .full .caption {
    position: absolute;
    top: calc(var(--margin) + var(--logo-size));
    left: var(--margin);
  }
  [data-title="top"] .face:not(.full) .caption {
    order: -1;
    margin-top: var(--logo-size);
  }
  [data-title="side"] .caption {
    align-self: flex-end;
    max-width: 65%;
  }
  .landscape .face {
    gap: 1cqw;
  }
  .landscape .title {
    font-size: max(10px, calc(var(--font) * 0.67));
  }
  .landscape .footer {
    height: 5cqw;
    min-height: 5cqw;
  }
  .landscape .serial {
    font-size: clamp(9px, calc(var(--serial-size) * 0.65), 20px);
  }
  @container (max-width:170px) {
    .title {
      font-size: max(10px, var(--font));
    }
  }
</style>
