import { createActor, waitFor, Actor } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { startPrisma } from './db/prismaClient.js';

export let rootActor: Actor<typeof notbetriebRootMachine>;

export const initializeApp = async (sessionName: string | undefined) => {
	console.log('initialize app function called');
	if (sessionName === undefined) {
		process.env.SESSION_NAME = new Date()
			.toLocaleString('de-DE')
			.replace(/[:.\s]/g, '-');

		rootActor = createActor(notbetriebRootMachine, {
			systemId: 'root',
			input: undefined,
		});
		startPrisma();
	} else {
		//!Implement when v5 persistence working, see branch feature/remoteAppStart
	}

	rootActor.subscribe({
		next(state: any) {
			console.log('Actual State', state.value, 'Event', state.event);
		},
		complete() {
			console.log('workflow completed', rootActor.getSnapshot().output);
		},
	});

	rootActor.start();

	const rootActorSnapshot = await waitFor(rootActor, (state) =>
		state.matches('ready')
	);

	Object.keys(rootActorSnapshot.children).forEach((child) => {
		rootActorSnapshot.children[child].subscribe((snapshot: any) =>
			console.log('rootActor child subscribe ', snapshot.value, 'child ', child)
		);
	});

	// startPrisma();
	console.log('App initialized');
};
