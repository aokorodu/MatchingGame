import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		rows: 6,
		columns: 6,
		cardWidth: 60,
		cardHeight: 60,
		duration: 30
	}
});

app.init();

export default app;