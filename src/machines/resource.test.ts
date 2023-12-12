import { expect, it, beforeEach } from 'vitest';
import { notbetriebRootMachine } from './notbetriebRoot.js';
import { generateResources } from '../util/generateResources.js';
import { createActor, fromPromise, ActorRefFrom } from 'xstate';

let rootActor: ActorRefFrom<typeof notbetriebRootMachine>;

beforeEach(() => {
	const resources = [{ callsign: '1183-1', type: 'rtw' }];

	const notbetriebRootMachineTest = notbetriebRootMachine.provide({
		actors: {
			//@ts-ignore
			createSessionDb: fromPromise(() => Promise.resolve(null)),
			//@ts-ignore
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

		const child = rootActor.system.get('1183-1');
		child.subscribe((state: any) => {
			if (state.matches({ reserved: 'R2' })) {
				expect(state.value).toEqual({ reserved: 'R2' });
				expect(state.context.sceneNumber).toEqual(1);
				expect(state.context.resourceLineIndex).toEqual('0');
				done(null);
			}
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1183-1',
				eventType: 'DISPOSE-RESOURCE-REQUEST',
				sceneNumber: '1',
				resourceLineIndex: '0',
			},
		});
	}));
