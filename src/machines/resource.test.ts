import { expect, it, beforeEach } from 'vitest';
import { notbetriebRootMachine } from './notbetriebRoot.js';
import { generateResources } from '../util/generateResources.js';
import { createActor, fromPromise, ActorRefFrom } from 'xstate';

let rootActor: ActorRefFrom<typeof notbetriebRootMachine>;

beforeEach(() => {
	const resources = [{ callsign: '1183-1', type: 'rtw' }];

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

const sceneFlow = () => {
	const scene = {
		address: {
			street: 'Mainzer Landstraße 25',
		},
		alarmKeyword: 'R1',
	};

	const initialResources = generateResources(scene.alarmKeyword);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: { ...scene, initialResources },
	});
};

it('should set the correct scene Number and resource line index when disposed for scene', async () =>
	new Promise((done) => {
		sceneFlow();

		rootActor.getSnapshot().children['1183-1'].subscribe((state) => {
			if (state.matches({ reserved: 'R2' })) {
				expect(state.value).toEqual({ reserved: 'R2' });
				expect(state.context.sceneNumber).toEqual('1');
				expect(state.context.resourceLineIndex).toEqual('0');
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
	}));
