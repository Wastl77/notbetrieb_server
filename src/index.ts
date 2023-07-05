import express from 'express';
import routes from './routes/index.js';
import { interpret } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';

const app = express();

app.use('/resource', routes.resource);

const rootActor = interpret(notbetriebRootMachine, {
	systemId: 'Notbetrieb Root',
});

rootActor.subscribe((state) => {
	console.log('Value Root:', state.value);
	console.log('Context Root:', state.context);
});
rootActor.start();

app.listen(8000, () => {
	console.log('listening on port 8000');
});
