import { createActor, waitFor, Actor } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { startPrisma } from './db/prismaClient.js';

export let rootActor: Actor<typeof notbetriebRootMachine>;

/**
 * Initializes the app.
 * @param {string} [sessionName] - Optional name for the session.
 */
export const initializeApp = async (sessionName: string | undefined) => {
	console.log('initialize app function called');
	if (sessionName === undefined) {
		process.env.SESSION_NAME = new Date()
			.toLocaleString('de-DE')
			.replace(/[:.\s]/g, '-');

		rootActor = createActor(notbetriebRootMachine, {
			systemId: 'root',
			input: undefined,
			inspect: (inspectionEvent) => {
				if (inspectionEvent.type === '@xstate.actor') {
					console.log('ACTOR Event:');
					console.log(inspectionEvent.actorRef.id);
				}
				if (inspectionEvent.type === '@xstate.event') {
					console.log('EVENT Event:');
					console.log(
						`ID: ${inspectionEvent.sourceRef?.id}, Context: ${
							inspectionEvent.sourceRef?.getSnapshot().state?.context
						}`
					);
					console.log(inspectionEvent.targetRef.id);
					console.log(inspectionEvent.event);
				}
			},
		});
		startPrisma();
	} else {
		//!Implement when v5 persistence working, see branch feature/remoteAppStart
	}

	// rootActor.subscribe({
	// 	next(state: any) {
	// 		console.log('Actual State', state.value, 'context: ', state.context);
	// 	},
	// 	complete() {
	// 		console.log('workflow completed', rootActor.getSnapshot().output);
	// 	},
	// });

	rootActor.start();

	// const rootActorSnapshot = await waitFor(rootActor, (state) =>
	// 	state.matches('ready')
	// );

	// Object.keys(rootActorSnapshot.children).forEach((child) => {
	// 	let previousSnapshot = rootActorSnapshot.children[child].getSnapshot();
	// 	rootActorSnapshot.children[child].subscribe((snapshot: any) => {
	// 		console.log(
	// 			'rootActor child subscribe ',
	// 			snapshot.value,
	// 			'child ',
	// 			child
	// 		);
	// 		if (previousSnapshot === snapshot) {
	// 			console.log('true'); // hier in mongodb schreiben
	// 		}
	// 		previousSnapshot = snapshot;
	// 	});
	// });

	// setTimeout(() => {
	// 	const snapshot = rootActor.getSnapshot();
	// 	console.log(snapshot.children['sceneNumber1'].getSnapshot().context);
	// }, 12000);

	// startPrisma();
	console.log('App initialized');
};
