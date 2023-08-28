import { createMachine } from 'xstate';

export const resource = createMachine({
	types: {} as {
		events: { type: 'SET-STATUS-QtD2' };
	},
	context: {},
	initial: 'available State',
	states: {
		'available State': {
			initial: 'D2',
			states: {
				D2: {
					on: {
						'SET-STATUS-QtD2': {
							target: 'QtD2',
						},
					},
				},
				QtD2: {
					entry: [() => console.log('QtD2 state entered')],
				},
			},
		},
	},
});
