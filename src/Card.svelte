<script>
  import { createEventDispatcher } from "svelte";
  import { gsap } from "gsap";

  const dispatch = createEventDispatcher();

  let holder;
  let face;
  export let symbol = "A";
  export let x;
  export let y;
  export let w = 50;
  export let h = 50;
  export let index;
  let position = {
    x: x,
    y: y,
  };

  let state = {
    showing: false,
    selected: true,
    locked: false,
  };

  const fadeDuration = 0.3;

  export function move(newX, newY, delay = 0) {
    gsap.to(position, {
      duration: 0.67,
      x: newX,
      y: newY,
      delay: delay,
      ease: "power4.inOut",
      onUpdate: () => {
        position = position;
      },
    });
  }

  export function getSymbol() {
    return symbol;
  }

  export function show(delay = 0) {
    state.selected = true;

    gsap.to(face, {
      duration: fadeDuration,
      opacity: 0,
      delay: delay,
    });
  }

  export function hide(delay = 0) {
    state.selected = false;

    gsap.to(face, {
      duration: fadeDuration,
      opacity: 1,
      delay: delay,
    });
  }

  export function lock() {
    state.locked = true;
    state = state;
  }

  function clickhandler(e) {
    if (state.selected) return;
    if (state.locked) return;

    dispatch("cardClick", {
      index: index,
      symb: symbol,
    });
  }
</script>

<g
  bind:this={holder}
  transform="translate({parseInt(position.x) + w / 2}, {parseInt(
    position.y + h / 2
  )})"
>
<g id="holder_2">
  <rect
    x={-w / 2}
    y={-h / 2}
    width={w}
    height={h}
    rx="10"
    ry="10"
    fill="#fafafa"
    stroke="#212121"
    stroke-width="2"
  />

  <text
    x="0"
    y="0"
    fill="#212121"
    stroke="none"
    font-size="30"
    font-weight="900"
    dominant-baseline="middle"
    text-anchor="middle">{symbol}</text
  >

  <rect
    bind:this={face}
    on:click={clickhandler}
    id="face"
    x={-w / 2}
    y={-h / 2}
    rx="10"
    ry="10"
    width={w}
    height={h}
    fill="#288DDD"
    opacity="0"
    stroke="black"
  />

  <!-- <rect
    on:click={clickhandler}
    id="hitarea"
    x={-w / 2}
    y={-h / 2}
    width={w}
    height={h}
    fill="#288DDD"
    fill-opacity="0"
  /> -->
</g>
</g>

<style>
  text {
    pointer-events: none;
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
  }

  #holder_2 {
    transform: scale(1);
    transition-property: transform;
    transition-duration: 333ms;
    transition-timing-function: ease-out;
  }

  #holder_2:hover {
    transform: scale(1.1);
  }
</style>
