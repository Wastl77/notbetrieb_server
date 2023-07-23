import 'dotenv/config';
import express from 'express';
import routes from './routes/index.js';
import { interpret } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { persistState } from './db/persistState.js';

const app = express();

app.use('/resource', routes.resource);

export const rootActor = interpret(notbetriebRootMachine, {
	systemId: 'Notbetrieb Root',
});

rootActor.subscribe((state) => {
	console.log('Value Root:', state.value);
	if (state.context.ref !== undefined) {
		console.log('Child State', state.context.ref[0]._state.value);
	}
});
rootActor.start();

setTimeout(async () => {
	await persistState();
}, 7000);

setTimeout(async () => {
	await persistState();
}, 14000);

app.listen(8000, () => {
	console.log('listening on port 8000');
});
