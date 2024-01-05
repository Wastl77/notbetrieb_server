import { createActor, Actor, AnyActorRef } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { startPrisma, prisma } from './db/prismaClient.js';
import { getPersistedState, persistState } from './db/persistState.js';

export let rootActor: Actor<typeof notbetriebRootMachine>;

const subscribeAndPersistActor = async (actor: AnyActorRef) => {
	console.log(`Subscribe called for: ${actor.id}`);
	if (actor.src === 'resource') {
		actor.subscribe(async (snapshot) => {
			console.log(
				`ActorId-Context: ${actor.id}, ${JSON.stringify(
					snapshot.context,
					undefined,
					2
				)}`
			);
			console.log(
				`ActorId-State: ${actor.id}, ${JSON.stringify(
					snapshot.value,
					undefined,
					2
				)}`
			);
			const result = await prisma.resource.upsert({
				where: {
					callsign: snapshot.context.callsign,
				},
				update: {
					resourceStatus: JSON.stringify(snapshot.value),
					resourceLineIndex: snapshot.context.resourceLineIndex,
					sceneNumber: snapshot.context.sceneNumber,
				},
				create: {
					...snapshot.context,
					resourceStatus: JSON.stringify(snapshot.value),
				},
			});
			console.log(result);
		});
	}
};

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

		await startPrisma();

		rootActor = createActor(notbetriebRootMachine, {
			systemId: 'root',
			id: 'root',
			inspect: (inspectionEvent) => {
				if (inspectionEvent.type === '@xstate.actor') {
					// console.log('ACTOR Event:');
					// console.log(inspectionEvent);
					if (
						inspectionEvent.actorRef.src === 'resource' ||
						inspectionEvent.actorRef.src === 'scene'
					) {
						subscribeAndPersistActor(inspectionEvent.actorRef);
					}
				}
				// if (inspectionEvent.type === '@xstate.event') {
				// 	console.log('EVENT Event:');
				// 	console.log(
				// 		`ID: ${inspectionEvent.sourceRef?.id}, Context: ${
				// 			inspectionEvent.sourceRef?.getSnapshot().state?.context
				// 		}`
				// 	);
				// 	console.log(inspectionEvent.actorRef.id);
				// 	console.log(inspectionEvent.event);
				// }
				if (inspectionEvent.type === '@xstate.snapshot') {
					// console.log(inspectionEvent.snapshot);
					if (inspectionEvent.actorRef === rootActor) {
						persistState();
						console.log('State persisted!');
						// console.log(inspectionEvent);
					}
				}
			},
		});
	} else {
		process.env.SESSION_NAME = sessionName;

		await startPrisma();

		const persistedState = await getPersistedState();
		rootActor = createActor(notbetriebRootMachine, {
			systemId: 'root',
			id: 'root',
			snapshot: persistedState,
			// inspect: (inspectionEvent) => {
			// 	if (inspectionEvent.type === '@xstate.actor') {
			// 		console.log('ACTOR Event:');
			// 		console.log(inspectionEvent.actorRef.id);
			// 	}
			// 	if (inspectionEvent.type === '@xstate.event') {
			// 		console.log('EVENT Event:');
			// 		console.log(
			// 			`ID: ${inspectionEvent.sourceRef?.id}, Context: ${
			// 				inspectionEvent.sourceRef?.getSnapshot().state?.context
			// 			}`
			// 		);
			// 		console.log(inspectionEvent.actorRef.id);
			// 		console.log(inspectionEvent.event);
			// 	}
			// 	if (inspectionEvent.type === '@xstate.snapshot') {
			// 		console.log(inspectionEvent.snapshot);
			// 		if (inspectionEvent.actorRef === rootActor) {
			// 			persistState();
			// 			console.log('State persisted!');
			// 		}
			// 	}
			// },
		});
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

	// rootActor.subscribe((state: any) => {
	// 	if (state.matches('ready')) {
	// 		if (rootActor.getSnapshot().children['sceneNumber1'] !== undefined) {
	// 			const sceneChild = rootActor
	// 				.getSnapshot()
	// 				.children['sceneNumber1'].getSnapshot();
	// 			console.log(sceneChild.state);
	// 		}
	// 		const child = rootActor.getSnapshot().children['1183-1'].getSnapshot();
	// 		console.log(child.context);
	// 	}
	// });
	console.log('App initialized');
};
