import { assign, createMachine, fromPromise } from 'xstate';
import { RESOURCES, Resource } from '../data/resources.js';

async function fetchResources(): Promise<Array<Resource>> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (Math.random() < 0.5) {
				reject();
				return;
			}
			resolve(RESOURCES);
		}, 1000);
	});
}

export const fetchInitialDataMachine = createMachine({
	id: 'fetchInitialDataMachine',
	initial: 'idle',
	context: {
		data: null,
	},
	states: {
		idle: {
			on: {
				FETCH: 'loading',
			},
		},
		loading: {
			invoke: {
				src: fromPromise(() => fetchResources()),
				onDone: {
					target: 'success',
					actions: assign({
						data: ({ event }) => event.output,
					}),
				},
				onError: 'failure',
			},
		},
		success: { type: 'final' },
		//TODO: Add counter and after 5 retries transition to error state in root machine
		failure: {
			after: {
				1000: 'loading',
			},
			on: {
				RETRY: 'loading',
			},
		},
	},
});
