<script>
	import Card from "./Card.svelte";

	let svg;
	let cardHolder;
	let w = 500;
	let h = 500;
	let cardWidth = 50;
	let cardHeight = 50;
	let gap = 10;
	export let rows;
	export let columns;
	let rowWidth = columns * (cardWidth + gap) - gap;
	let columnHeight = rows * (cardHeight + gap) - gap;
	let totalCards = rows * columns;
	let str = "AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPP";
	str = str.substring(0, totalCards);
	let symbols = str.split("");
	let cardArray = [];


	let selectedCards = [];
	let matches = 0;

	export function init() {
		console.log("cards:", cardArray.length);
		arrange();
	}

	function arrange() {
		const startX = (w - rowWidth) / 2;
		const startY = (h - columnHeight) / 2;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < columns; c++)
				cardArray[r * rows + c].position(startX + r * 60, startY + c * 60);
		}
	}

	function handleCardClick(e) {
		if(selectedCards.length >= 2) return;

		const index = e.detail.index;


		const newCard = cardArray[index];
		newCard.show();
		selectedCards.push(newCard);
	


		if(selectedCards.length == 2){
			if(selectedCards[0].getSymbol() == selectedCards[1].getSymbol()){
				console.log("match!");
				matches++;
			} else {
				console.log('no match');
				setTimeout(deselectCards, 2000);
			}
		}
	}

	function deselectCards(){
		selectedCards.forEach(card =>{
			card.hide();
		});

		selectedCards = []
	}
</script>

<main>
	<div>matches: {matches}</div>
	<svg bind:this={svg} width="{w}px" height="{h}px" viewBox="0 0 {w} {h}">
		<g bind:this={cardHolder} />
		{#each symbols as symbol, index}
			<Card
				on:cardClick={handleCardClick}
				x="0"
				y="0"
				{index}
				bind:this={cardArray[index]}
				{symbol}
			/>
		{/each}
	</svg>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	svg {
		border: 1px solid black;
	}
</style>
