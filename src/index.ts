import 'dotenv/config';
import express from 'express';
import routes from './routes/index.js';
import { interpret } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';

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

app.listen(8000, () => {
	console.log('listening on port 8000');
});
