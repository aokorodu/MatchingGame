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
	let str = "AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSSTTUUVVWWXXYYZZ";
	str = str.substring(0, totalCards);
	let symbols = str.split("");
	let cardArray = [];

	let selectedCards = [];
	let matches = 0;
	let noMatches = 0;

	export function init() {
		console.log("cards:", cardArray.length);
		deal();
		setTimeout(shuffle, 5000);
	}

	function deal() {
		const startX = (w - rowWidth) / 2;
		const startY = (h - columnHeight) / 2;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < columns; c++) {
				const ind = totalCards - (r * rows + c);
				cardArray[r * rows + c].move(
					startX + r * (cardWidth + gap),
					startY + c * (cardHeight + gap),
					ind / 20
				);
			}
		}
	}

	function handleCardClick(e) {
		if (selectedCards.length >= 2) return;

		const index = e.detail.index;
		const newCard = cardArray[index];
		newCard.show();
		selectedCards.push(newCard);
		checkIfMatching();
	}

	function checkIfMatching() {
		if (selectedCards.length == 2) {
			if (isMatching()) {
				collectWinnings();
			} else {
				putEmBack();
			}
		}
	}

	function isMatching() {
		let matching = false;
		if (selectedCards[0].getSymbol() == selectedCards[1].getSymbol()) {
			matching = true;
		}

		return matching;
	}

	function collectWinnings() {
		matches++;
		selectedCards.forEach((card) => {
			card.lock();
		});

		selectedCards = [];
	}

	function putEmBack() {
		noMatches++;
		setTimeout(() => {
			selectedCards.forEach((card) => {
				card.hide();
			});

			selectedCards = [];
		}, 2000);
	}

	function shuffle(){
		let indexArray = [];
		for(let i = 0; i < totalCards; i++){
			indexArray.push(i);
		}
		indexArray = indexArray.sort((a, b) => 0.5 - Math.random());
		console.log('indexArray:', indexArray.toString())

		const startX = (w - rowWidth) / 2;
		const startY = (h - columnHeight) / 2;
		for(let i = 0; i < totalCards; i++){
			let col = i % columns;
			let row = Math.floor(i/columns);
			const index = indexArray[i];
			cardArray[index].move(
					startX + row * (cardWidth + gap),
					startY + col * (cardHeight + gap)
				);
		}
	}
</script>

<main>
	<div>matches: {matches} wrong guesses: {noMatches}</div>
	<svg bind:this={svg} width="{w}px" height="{h}px" viewBox="0 0 {w} {h}">
		<g bind:this={cardHolder} />
		{#each symbols as symbol, index}
			<Card
				on:cardClick={handleCardClick}
				x="35"
				y={h / 2}
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
