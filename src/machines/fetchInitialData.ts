import { assign, createMachine, fromPromise, sendTo } from 'xstate';
import { RESOURCES, Resource } from '../data/resources.js';

async function fetchResources(): Promise<Array<Resource>> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (Math.random() < 0.999999999) {
				reject();
				return;
			}
			resolve(RESOURCES);
		}, 1000);
	});
}

export const fetchInitialDataMachine = createMachine({
	// types: {} as {
	// 	context: { count: number };
	// 	events: { type: 'FETCH-SUCCESS' };
	// },
	id: 'fetchMachine',
	context: {
		count: 0,
	},
	initial: 'idle',
	states: {
		idle: {
			always: {
				target: 'loading',
			},
		},
		loading: {
			entry: [],
			invoke: {
				src: fromPromise(() => fetchResources()),
				onDone: {
					target: 'success',
					actions: [
						sendTo(
							({ system }) => system.get('Notbetrieb Root'),
							({ event }) => {
								return { type: 'FETCH-SUCCESS', data: event.output };
							}
						),
					],
				},
				onError: [
					{
						guard: ({ context }) => context.count > 4,
						target: 'failed',
					},
					{ target: 'failure' },
				],
			},
		},
		failed: {
			entry: [
				sendTo(
					({ system }) => system.get('Notbetrieb Root'),
					() => {
						return { type: 'FETCH-ERROR' };
					}
				),
			],
			type: 'final',
		},
		success: { type: 'final' },
		failure: {
			entry: [
				assign({ count: ({ context }) => context.count + 1 }),
				({ context }) => console.log('count erhöht auf', context.count),
			],
			after: {
				1000: 'loading',
			},
		},
	},
});
