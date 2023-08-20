import { interpret } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { startPrisma } from './db/prismaClient.js';

export let rootActor: any;

export const initializeApp = async (sessionName: string | undefined) => {
	if (sessionName === undefined) {
		process.env.SESSION_NAME = new Date()
			.toLocaleString('de-DE')
			.replace(/[:.\s]/g, '-');

		rootActor = interpret(notbetriebRootMachine, {
			systemId: 'Notbetrieb Root',
			input: undefined,
		});
	} else {
		//!Implement when v5 persistence working, see branch feature/remoteAppStart
	}

	rootActor.subscribe({
		next(state: any) {
			console.log('Actual State', state.value);
		},
		complete() {
			console.log('workflow completed', rootActor.getSnapshot().output);
		},
	});
	rootActor.start();

	startPrisma();
	console.log('App initialized');
};
