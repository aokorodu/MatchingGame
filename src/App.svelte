<script>
	import Card from "./Card.svelte";
	import Timer from "./Timer.svelte";
	import Bumper from "./Bumper.svelte";
	let svg;
	let cardHolder;
	let svgWidth = "500px";
	let svgHeight = "500px";
	// let svgWidth = "100%";
	// let svgHeight = "100%";
	let w = 500;
	let h = 500;
	
	let gap = 10;
	export let rows;
	export let columns;
	export let cardWidth = 60;
	export let cardHeight = 60;
	export let duration = 60;
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

	let started = false;

	let timer;
	let gameOver = false;

	export function init() {
		console.log("cards:", cardArray.length);
	}

	export function handleStartClick() {
		if(started) return;

		start();
	}

	function start(){
		started = true;
		deal();
		setTimeout(hideAll, totalCards*100);
		setTimeout(shuffle, totalCards*150);
		setTimeout(begin, totalCards*200);
	}

	function begin(){
		console.log('begin')
		gameOver = false;
	}

	function end(){
		console.log('end')
		gameOver = true;
		timer.stop();
	}

	function hideAll(){
		console.log('hiding');
		cardArray.forEach((card, index)=>{
			const row = Math.floor(index/rows);
			const col = index % columns
			card.hide(row/10 + col/10)
		})
	}

	function deal() {
		console.log('dealing');

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
		if(gameOver) return;
		if (selectedCards.length >= 2) return;

		if(!timer.isRunning()) timer.start();
		
		

		selectCard(e.detail.index)
		checkIfMatching();

		if(theyWon()) end();
	}

	function handleTimesUp(){
		console.log('Times UP!!');
		end();
	}

	function selectCard(cardIndex){
		const newCard = cardArray[cardIndex];
		newCard.show();
		selectedCards.push(newCard);
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

	function theyWon(){
		if(matches == totalCards/2) return true;

		return false;
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
		}, 1200);
	}

	function shuffle() {
		console.log('shuffling');
		let indexArray = [];
		for (let i = 0; i < totalCards; i++) {
			indexArray.push(i);
		}
		indexArray = indexArray.sort((a, b) => 0.5 - Math.random());

		const startX = (w - rowWidth) / 2;
		const startY = (h - columnHeight) / 2;
		for (let i = 0; i < totalCards; i++) {
			let col = i % columns;
			let row = Math.floor(i / columns);
			const index = indexArray[i];
			cardArray[index].move(
				startX + row * (cardWidth + gap),
				startY + col * (cardHeight + gap),
				Math.random()
			);
		}
	}
</script>

<main>
	<div class="scorecard">	MATCHES: <span>{matches}</span> WRONG GUESSES: <span>{noMatches}</span></div>
	<svg bind:this={svg} width={svgWidth} height={svgHeight} viewBox="0 0 {w} {h}">
		<rect x="-50" y="490" width="600" height="10" fill="#212121" />
		<g bind:this={cardHolder} />
		{#each symbols as symbol, index}
			<Card
				on:cardClick={handleCardClick}
				x={(25) + (index * .5)}
				y={(h/2) - (index * .5)}
				w={cardWidth}
				h={cardHeight}
				{index}
				bind:this={cardArray[index]}
				{symbol}
			/>
		{/each}
		<Timer on:timesUp={handleTimesUp} bind:this={timer} x="450" y="35" duration={duration} />
		<!-- {#if ((gameOver && started) || (matches == totalCards/2))} -->
		<Bumper message={matches == totalCards/2 ? 1 : 0}/>
		<!-- {/if} -->
	</svg>

	<div 
		on:click={handleStartClick} 
		class="deal-button">START</div>
</main>

<style>
	.scorecard {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: .5rem;
	}
	span {
		font-size: 3rem;
		font-weight: 900;
	}
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

	.deal-button {
		padding: 0.5rem 2rem;
		border: 3px solid #212121;
		margin: 1rem;
		border-radius: 10px;
		font-weight: bold;
		color: #212121;
		background-color: #eaeaea;
		transition-property: all;
		transition-duration: 0.3s;
		-webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
	}

	.deal-button:hover {
		font-weight: bold;
		background-color: #fff;
		cursor: pointer;
	}
</style>
