import { createMachine } from 'xstate';

export const resource = createMachine({
	types: {} as {
		events: { type: 'SET-STATUS-1' };
	},
	id: 'resource',
	context: {},
	initial: 'available State',
	states: {
		'available State': {
			initial: 'D2',
			states: {
				D2: {
					on: {
						'SET-STATUS-1': {
							target: 'D1',
						},
					},
				},
				D1: {
					entry: [() => console.log('D1 state entered')],
				},
			},
		},
	},
});
