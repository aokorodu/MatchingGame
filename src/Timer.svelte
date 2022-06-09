<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let x = 250;
  export let y = 50;
  export let duration = 60;
  let elapsed = 0;
  $: remaining = duration - elapsed;

  let timerInterval
  let started = false;

  export function isRunning(){
    return started;
  }

  export function start(){
    console.log('timer start')
    started = true;

    timerInterval = setInterval(() => {
      tick()
    }, 1000);
  }

  export function stop(){
    console.log('timer stop')
    clearInterval(timerInterval);
  }

  function end() {  
    console.log('timer end')
    dispatch("timesUp");
  }

  function tick(e){
    console.log('timer tick')
    if(remaining <= 0) {
      stop();
      end();

      return;
    }
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