import { createMachine } from 'xstate';
// import { Prisma } from '@prisma/client';

// export const resourcesRef = {} as {
// 	[key: string]: any;
// };

// type SessionInput = { [key: string]: any };

// export const spawnResources = (
// 	fetchInput: Prisma.ResourceCreateInput[] | undefined,
// 	sessionInput: SessionInput[] | undefined
// ) => {
// 	if (fetchInput) {
// 		fetchInput.forEach((item) => {
// 			console.log('key in ref: ', item.callsign);
// 			const interpretedResourceMachine = interpret(resource, {
// 				systemId: item.callsign,
// 			}).start();
// 			interpretedResourceMachine.subscribe({
// 				next(state) {
// 					console.log('Resource: ', item.callsign, ' State: ', state.value);
// 				},
// 			});
// 			resourcesRef[item.callsign] = interpretedResourceMachine;
// 		});
// 	}

// 	if (sessionInput) {
// 		sessionInput.forEach((item) => {
// 			for (const [key, value] of Object.entries(item)) {
// 				console.log('key in ref from session: ', key);
// 				const interpretedResourceMachine = interpret(resource, {
// 					state: value,
// 				}).start();
// 				interpretedResourceMachine.subscribe({
// 					next(state) {
// 						console.log('Resource: ', key, ' State: ', state.value);
// 					},
// 				});
// 				resourcesRef[key] = interpretedResourceMachine;
// 			}
// 		});
// 	}

// 	return resourcesRef;
// };

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
