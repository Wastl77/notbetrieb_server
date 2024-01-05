import { createActor, Actor, AnyActorRef } from 'xstate';
import { notbetriebRootMachine } from './machines/notbetriebRoot.js';
import { startPrisma, prisma } from './db/prismaClient.js';
import { getPersistedState, persistState } from './db/persistState.js';

export let rootActor: Actor<typeof notbetriebRootMachine>;

const subscribeAndPersistActor = async (actor: AnyActorRef) => {
	console.log(`Subscribe called for: ${actor.id}`);
	if (actor.src === 'resource') {
		actor.subscribe(async (snapshot) => {
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
					if (
						inspectionEvent.actorRef.src === 'resource' ||
						inspectionEvent.actorRef.src === 'scene'
					) {
						subscribeAndPersistActor(inspectionEvent.actorRef);
					}
				}
				if (inspectionEvent.type === '@xstate.snapshot') {
					if (inspectionEvent.actorRef === rootActor) {
						persistState();
						console.log('State persisted!');
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
			inspect: (inspectionEvent) => {
				if (inspectionEvent.type === '@xstate.actor') {
					console.log('ACTOR Event:');
					console.log(inspectionEvent.actorRef.id);
					if (
						inspectionEvent.actorRef.src === 'resource' ||
						inspectionEvent.actorRef.src === 'scene'
					) {
						subscribeAndPersistActor(inspectionEvent.actorRef);
					}
				}
				if (inspectionEvent.type === '@xstate.snapshot') {
					if (inspectionEvent.actorRef === rootActor) {
						persistState();
						console.log('State persisted!');
					}
				}
			},
		});
	}

	rootActor.start();
	console.log('App initialized');
};
