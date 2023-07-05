import { assign, createMachine, fromPromise, sendTo } from 'xstate';
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
	id: 'fetchMachine',
	initial: 'idle',
	context: {
		data: null,
	},
	states: {
		idle: {
			always: {
				target: 'loading',
			},
		},
		loading: {
			invoke: {
				src: fromPromise(() => fetchResources()),
				onDone: {
					target: 'success',
					actions: [
						assign({
							data: ({ event }) => event.output, // daten zum parent wohl nur über send event zum parent mit data
						}),
						({ event }) => console.log('promise done', event.output),
						sendTo(
							({ system }) => system.get('Notbetrieb Root'),
							({ event }) => {
								return { type: 'FETCH-SUCCESS', data: event.output };
							}
						),
					],
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
		},
	},
});
