<script lang="ts">
  import type { Finish } from "./layout";
  let {
    finish: f,
    frame = false,
    pointer = 50,
  }: { finish: Finish; frame?: boolean; pointer?: number } = $props();
</script>

<div
  aria-hidden="true"
  class="finish"
  class:frame
  data-type={f.type}
  data-motion={f.motion}
  style={`--a:${f.color};--b:${f.second};--power:${f.intensity / 100};--width:${f.width}cqw;--angle:${f.angle}deg;--scale:${f.scale}cqw;--speed:${f.speed}s;--pointer:${pointer}%`}
></div>

<style>
  .finish {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: var(--power);
    background: linear-gradient(
      var(--angle),
      transparent calc(50% - var(--width)),
      var(--a) calc(50% - var(--width) / 2),
      white 50%,
      var(--b) calc(50% + var(--width) / 2),
      transparent calc(50% + var(--width))
    );
    background-size: 250% 100%;
    background-position: var(--pointer) 50%;
    transition: background-position 0.15s;
    z-index: 2;
  }
  [data-type="none"] {
    display: none;
  }
  .frame {
    border: var(--width) solid transparent;
    mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
  [data-type="holographic"] {
    background-image: linear-gradient(
      var(--angle),
      var(--a),
      var(--b),
      #fff7a0,
      var(--a)
    );
    mix-blend-mode: screen;
  }
  [data-type="prismatic"] {
    background-image: repeating-conic-gradient(
      from var(--angle),
      var(--a),
      transparent 25deg,
      var(--b) 50deg,
      transparent 75deg
    );
    background-size: var(--scale) var(--scale);
  }
  [data-type="glitter"] {
    background-image:
      radial-gradient(var(--a) 1px, transparent 2px),
      radial-gradient(var(--b) 1px, transparent 2px);
    background-size: var(--scale) var(--scale);
    background-position:
      0 0,
      calc(var(--scale) / 2) calc(var(--scale) / 2);
  }
  [data-type="neon"] {
    background: none;
    border: calc(var(--width) / 3) solid var(--a);
    box-shadow:
      inset 0 0 var(--width) var(--a),
      inset 0 0 calc(var(--width) * 2) var(--b);
    mask: none;
  }
  [data-type="neon"][data-motion="pointer"]::after {
    content: "";
    position: absolute;
    inset: 0;
    border: var(--width) solid transparent;
    background: radial-gradient(
      ellipse at var(--pointer) 50%,
      white,
      transparent 65%
    );
    mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
  [data-motion="animated"] {
    animation: sweep var(--speed) ease-in-out infinite alternate;
  }
  [data-type="neon"][data-motion="animated"] {
    animation: pulse var(--speed) ease-in-out infinite alternate;
  }
  @keyframes sweep {
    from {
      background-position: 0% 50%;
    }
    to {
      background-position: 100% 50%;
    }
  }
  @keyframes pulse {
    from {
      opacity: calc(var(--power) * 0.45);
    }
    to {
      opacity: var(--power);
    }
  }
  @media (prefers-reduced-motion: reduce), (hover: none) {
    .finish {
      animation: none !important;
      transition: none;
      background-position: 50% 50%;
    }
  }
</style>
