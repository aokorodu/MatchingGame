<script>
  // import { gsap } from "gsap";

  export let x = 250;
  export let y = 50;
  export let duration = 60;
  let elapsed = 0;
  $: remaining = duration - elapsed;

  let int
  let started = false;

  export function isRunning(){
    return started;
  }

  export function start(){
    console.log('start timer');
    started = true;

    int = setInterval(() => {
      tick()
    }, 1000);
  }

  export function stop(){
    
  }

  function tick(e){
    if(remaining <= 0) return;
    elapsed++;
  }
</script>
<g transform="translate({x}, {y})">
  <text
    x="0"
    y="0"
    fill={remaining < 11 ? "red" : "white"}
    stroke={remaining < 11 ? "red" : "black"}
    stroke-width="2"
    font-size="60"
    font-weight="900"
    dominant-baseline="middle"
    text-anchor="middle">{remaining < 10 ? "0" : ""}{remaining}</text
  >
</g>