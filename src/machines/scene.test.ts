import { expect, it, beforeEach } from 'vitest';
import { notbetriebRootMachine } from './notbetriebRoot.js';
import { generateResources } from '../util/generateResources.js';
import { createActor, fromPromise, ActorRefFrom } from 'xstate';

let rootActor: ActorRefFrom<typeof notbetriebRootMachine>;

beforeEach(() => {
	const resources = [
		{ callsign: '1183-1', type: 'rtw' },
		{ callsign: '1184-1', type: 'rtw' },
		{ callsign: '1182-1', type: 'nef' },
		{ callsign: '1010-1', type: 'c-di' },
	];

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
		alarmKeyword: 'R2',
	};

	const initialResources = generateResources(scene.alarmKeyword);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: { ...scene, initialResources },
	});
};

it('should go from state waiting to state alarmed when all disposed resources are alarmed', async () =>
	new Promise((done) => {
		sceneFlow();

		const child = rootActor.system.get('sceneNumber1');
		child.subscribe((state: any) => {
			if (
				state.matches({
					open: { waitingState: 'alarmed', sceneState: 'disposed' },
				})
			) {
				expect(state.value).toEqual({
					open: { waitingState: 'alarmed', sceneState: 'disposed' },
				});
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

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1182-1',
				eventType: 'DISPOSE-RESOURCE-REQUEST',
				sceneNumber: '1',
				resourceLineIndex: '1',
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1183-1',
				eventType: 'SET-STATUS-QT',
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1182-1',
				eventType: 'SET-STATUS-QT',
			},
		});
	}));

it('adds a resource correctly when resource manually added', async () =>
	new Promise((done) => {
		sceneFlow();

		const child = rootActor.system.get('sceneNumber1');
		child.subscribe((state: any) => {
			if (
				state.matches({
					open: { waitingState: 'alarmed', sceneState: 'disposed' },
				})
			) {
				expect(state.value).toEqual({
					open: { waitingState: 'alarmed', sceneState: 'disposed' },
				});
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

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1182-1',
				eventType: 'DISPOSE-RESOURCE-REQUEST',
				sceneNumber: '1',
				resourceLineIndex: '1',
			},
		});

		rootActor.send({
			type: 'ADD-RESOURCE-MANUAL',
			params: {
				callsign: '1184-1',
				sceneId: 1,
				type: 'rtw',
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1183-1',
				eventType: 'SET-STATUS-QT',
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1182-1',
				eventType: 'SET-STATUS-QT',
			},
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1184-1',
				eventType: 'SET-STATUS-QT',
			},
		});
	}));

it('should add the resource lines and correct types when alarm keyword gets updated ', async () =>
	new Promise((done) => {
		const scene = {
			address: {
				street: 'Mainzer Landstraße 25',
			},
			alarmKeyword: 'F2[Wohn.]',
		};

		const initialResources = generateResources(scene.alarmKeyword);
		rootActor.send({
			type: 'CREATE-SCENE',
			params: { ...scene, initialResources },
		});

		rootActor.send({
			type: 'UPGRADE-ALARMKEYWORD',
			params: { sceneId: 1, newKeyword: 'F3[WohnY.]' },
		});

		const child = rootActor.system.get('sceneNumber1');
		child.subscribe((state: any) => {
			if (
				state.matches({
					open: { waitingState: 'waiting', sceneState: 'disposing' },
				})
			) {
				expect(state.context.resourceLines).toHaveLength(12);
				expect(state.context.resourceLines[0].callsign).toEqual('1010-1');
				done(null);
			}
		});

		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign: '1010-1',
				eventType: 'DISPOSE-RESOURCE-REQUEST',
				sceneNumber: '1',
				resourceLineIndex: '0',
			},
		});
	}));
