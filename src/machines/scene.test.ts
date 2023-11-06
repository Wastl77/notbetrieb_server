import { expect, it, beforeEach } from 'vitest';
import { notbetriebRootMachine } from './notbetriebRoot.js';
import { generateResources } from '../util/generateResources.js';
import { createActor, fromPromise, ActorRefFrom } from 'xstate';

let rootActor: ActorRefFrom<typeof notbetriebRootMachine>;

beforeEach(async () => {
	const resources = [
		{ callsign: '1183-1', type: 'rtw' },
		{ callsign: '1182-2', type: 'nef' },
	];

	const notbetriebRootMachineTest = notbetriebRootMachine.provide({
		actors: {
			createSessionDb: fromPromise(() => Promise.resolve(null)),
			fetchInitialData: fromPromise(() => Promise.resolve(resources)),
		},
	});

	rootActor = createActor(notbetriebRootMachineTest);

	if (rootActor.start !== undefined) {
		rootActor.start();
	}

	return () => rootActor.stop();
});

it('should go from state waiting to state alarmed when all disposed resources are alarmed', async () =>
	new Promise((done) => {
		const scene = {
			address: {
				street: 'Mainzer Landstraße 25',
			},
			alarmKeyword: 'R2',
		};

		const initialResources = generateResources(scene.alarmKeyword);
		rootActor.send({
			type: 'CREATE-SCENE',
			params: { ...scene, initialResources },
		});

		rootActor.getSnapshot().children['sceneNumber1'].subscribe((state) => {
			if (state.matches({ open: 'alarmed' })) {
				expect(state.value).toEqual({ open: 'alarmed' });
				done(null);
			}
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1183-1',
				eventType: 'DISPOSE-RESOURCE',
				params: {
					sceneNumber: '1',
					resourceLineIndex: '0',
				},
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1182-2',
				eventType: 'DISPOSE-RESOURCE',
				params: {
					sceneNumber: '1',
					resourceLineIndex: '1',
				},
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1183-1',
				eventType: 'SET-STATUS-QT',
				params: {},
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1182-2',
				eventType: 'SET-STATUS-QT',
				params: {},
			},
		});
	}));
