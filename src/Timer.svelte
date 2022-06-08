<script>
  export let x = 250;
  export let y = 50;
  export let duration = 60;
  let elapsed = 0;
  $: remaining = duration - elapsed;

  export function start(){

  }

  export function stop(){

  }
</script>
<g transform="translate({x}, {y})">
  <text
    x="0"
    y="0"
    fill="white"
    stroke="black"
    stroke-width="2"
    font-size="60"
    font-weight="900"
    dominant-baseline="middle"
    text-anchor="middle">{remaining}</text
  >
</g>