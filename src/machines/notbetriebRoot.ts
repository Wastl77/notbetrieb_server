import { createMachine } from 'xstate';
import { fetchInitialDataMachine } from './fetchInitialData.js';

export const notbetriebRootMachine = createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QDkD2AXARmdAnAlmJgAQBKqGAdAJIB2+6+AhgDbGzpPpgDEAYgFEAKgGEAEgFoAygFURIgVKkBtAAwBdRKAAOqWA3ypaWkAA9EAJlUA2SgFZVAdgAcF6wGZnzgIzOb1gBoQAE9Eb1UAFkoIgE446wsIxxjrB1ULAF8soNpUCDgTNCwcAiIyCnQTXX1GIxNzBAlAkMQm7JAi7DxCEnIqOgNWdk5uKr0DOqQzRAiLINCEH2i4mLtHdztvOxjHdfbOkp7yqlhtJgB3WmJcOFQAV1wAYwKp6onjKYb3VcoYmwsYt53BZnHF3I55oglml0rNnBFrK4gVkskA */
	id: 'Notbetrieb Root',
	initial: 'Initial state',
	states: {
		'Initial state': {
			invoke: {
				id: 'fetchMachine',
				src: fetchInitialDataMachine,
				// onDone: [
				// 	{
				// 		target: 'spawn resources',
				// 		actions: ({ event }) => {
				// 			console.log('onDone:', event);
				// 		},
				// 	},
				// ],
			},
			on: {
				'FETCH-SUCCESS': {
					target: 'spawn resources',
					actions: ({ event }) =>
						console.log('fetch success event', event.data),
				},
			},
		},
		'spawn resources': {
			entry: [
				({ event }) => {
					console.log('spawn State:', event.output);
				},
			],
		},
	},
	types: {},
});
