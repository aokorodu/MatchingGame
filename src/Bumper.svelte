<script>
  import { gsap } from "gsap";
  import { onMount } from "svelte";

  export let message = 0;
  let winningMessage = "You Win!!!";
  let losingMessage = "Game Over!!";

  let holder;

  $: displayMessage = message == 0 ? losingMessage : winningMessage;

  onMount(() => {
    gsap.to("#holder", {
      transform: "scale(1)",
      duration: 1,
      delay: 0.5,
      ease: "elastic.out",
      onComplete: () => {
        console.log("animation over");
      },
    });
  });
</script>

<g>
  <rect x="0" y="0" width="500" height="500" fill="black" fill-opacity=".8" />
  <g transform="translate(250 250)">
    <text
      id="holder"
      transform="scale(0)"
      x="0"
      y="0"
      fill="lightblue"
      stroke="none"
      font-size="70"
      font-weight="900"
      dominant-baseline="middle"
      text-anchor="middle">{displayMessage}</text
    ></g
  >
</g>

<style>
  text {
    transform-origin: center;
  }
</style>
