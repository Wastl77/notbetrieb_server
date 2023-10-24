import { createMachine, sendTo } from 'xstate';

export const resource = createMachine(
	{
		types: {} as {
			events: {
				type: 'DISPOSE-RESOURCE';
				params: {
					sceneNumber: string;
					resourceLineIndex: string;
					callsign: string;
				};
			};
			actions: { type: 'resourceDisposed' };
			input: { resourceType: string; callsign: string };
			context: { resourceType: string; callsign: string };
		},
		context: ({ input }) => ({
			resourceType: input.resourceType,
			callsign: input.callsign,
		}),
		id: 'resource',
		initial: 'available',
		states: {
			available: {
				initial: 'D2',
				states: {
					D2: {
						on: {
							'DISPOSE-RESOURCE': {
								target: '#resource.disposed.R2',
							},
						},
					},
				},
			},
			disposed: {
				initial: 'R2',
				states: {
					R2: {
						entry: [
							// ({ event }) =>
							// 	console.log('entry R2 event: ' + JSON.stringify(event)),
							'resourceDisposed',
						],
					},
				},
			},
		},
	},
	{
		actions: {
			resourceDisposed: sendTo(
				({ event, system }) =>
					system.get(`sceneNumber${event.params.sceneNumber}`),
				({ context, event }) => {
					return {
						type: 'DISPOSE-RESOURCE',
						params: {
							resourceLineIndex: event.params.resourceLineIndex,
							type: context.resourceType,
							callsign: context.callsign,
						},
					};
				}
			),
		},
	}
);
