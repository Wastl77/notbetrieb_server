import express from 'express';
import routes from './routes/index.js';
import { interpret } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRootMachine.js';

const app = express();

app.use('/resource', routes.resource);

const rootActor = interpret(notbetriebRootMachine);

rootActor.subscribe((state) => {
	console.log('Value:', state.value);
	console.log('Context:', state.context);
});
rootActor.start();

app.listen(8000, () => {
	console.log('listening on port 8000');
});
