import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		rows: 4,
		columns: 4,
		cardWidth: 50,
		cardHeight: 50,
		duration: 60
	}
});

app.init();

export default app;