import { createMachine } from 'xstate';
import { fetchInitialDataMachine } from './fetchInitialDataMachine.js';

export const notbetriebRootMachine = createMachine({
	id: 'Notbetrieb Root',
	initial: 'Initial state',
	states: {
		'Initial state': {
			invoke: {
				src: fetchInitialDataMachine,
				onDone: [
					{
						target: 'spawn resources',
					},
				],
			},
		},
		'spawn resources': {
			entry: [
				({ event }) => {
					console.log(event.output);
				},
			],
		},
	},
	types: {},
});
