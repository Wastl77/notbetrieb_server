import { interpret } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { startPrisma } from './db/prismaClient.js';
import { getPersistedState } from './db/persistState.js';

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
		process.env.SESSION_NAME = sessionName;

		const persistedState = await getPersistedState();

		rootActor = interpret(notbetriebRootMachine, {
			systemId: 'Notbetrieb Root',
			input: persistedState.resources,
		});
	}

	// rootActor.subscribe((state: any) => {
	// 	console.log('Value Root:', state.value);
	// 	if (
	// 		state.context.ref !== undefined &&
	// 		state.context.ref[0]._state !== undefined
	// 	) {
	// 		console.log('Child State', state.context.ref[0]._state.value);
	// 	}
	// });
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
