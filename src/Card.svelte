<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  export let symbol = "A";
  export let x;
  export let y;
  export let index;
  let w = 50;
  let h = 50;
  let showing = false;
  let selected = false;

  export function position(newX, newY) {
    x = newX;
    y = newY;
  }

  export function getSymbol(){
    return symbol
  }

  export function show() {
    selected = true;
  }

  export function hide() {
    selected = false;
  }

  function clickhandler(e) {
    if(selected) return;


    console.log("index", index);
    dispatch('cardClick', {
      index: index,
      symb:symbol
    })
  }
</script>

<g transform="translate({x + w / 2}, {y + h / 2})">
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
