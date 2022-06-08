<script>
  import { createEventDispatcher } from "svelte";
  import { gsap } from "gsap";

  const dispatch = createEventDispatcher();

  let holder;
  export let symbol = "A";
  export let x;
  export let y;
  export let index;
  let position = {
    x: x,
    y: y,
  };
  let w = 50;
  let h = 50;
  let showing = false;
  let selected = false;
  let locked = false;

  export function move(newX, newY, delay=0) {
    gsap.to(position, {
      duration: .5,
      x: newX,
      y: newY,
      delay:delay,
      onUpdate: () => {
        position = position;
      },
    });
  }

  export function getSymbol() {
    return symbol;
  }

  export function show() {
    selected = true;
  }

  export function hide() {
    selected = false;
  }

  export function lock(){
    locked = true;
  }

  function clickhandler(e) {
    if (selected) return;
    if (locked) return;

    console.log("index", index);
    dispatch("cardClick", {
      index: index,
      symb: symbol,
    });
  }
</script>

<g
  bind:this={holder}
  transform="translate({parseInt(position.x) + w/2}, {parseInt(position.y + h/2)})"
>
  <rect
    x={-w / 2}
    y={-h / 2}
    width={w}
    height={h}
    fill="white"
    stroke="black"
  />
  <text
    x="0"
    y="0"
    font-size="25"
    font-weight="900"
    dominant-baseline="middle"
    text-anchor="middle">{symbol}</text
  >
  {#if !selected}
    <rect
      on:click={clickhandler}
      x={-w / 2}
      y={-h / 2}
      width={w}
      height={h}
      fill="grey"
      fill-opacity="1"
      stroke="black"
    />
  {/if}
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
</style>
