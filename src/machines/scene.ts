import { createMachine, assign } from 'xstate';
import { SceneInputType } from '../../types.js';

export const scene = createMachine(
	{
		types: {} as {
			context: {
				adress: {
					street: string | null;
					object: string | null;
					district: string | null;
				};
				alarmKeyword: string;
				resourceLines: {
					id: number;
					type: string;
					callsign: string | null;
					status: 'not disposed' | 'disposed' | 'cancelled';
					cancelledCallsign?: string;
				}[];
			};
			input: SceneInputType;
		},
		context: {
			adress: { street: null, object: null, district: null },
			alarmKeyword: '',
			resourceLines: [],
		},
		initial: 'openScene',
		states: {
			openScene: {
				entry: ['resolveResources'],
				initial: 'waitingScene',
				states: {
					waitingScene: {},
					alarmedScene: {},
				},
			},
		},
	},
	{
		actions: {
			resolveResources: ({ event }) =>
				assign({
					resourceLines: event.input.resources.map(
						(resource: string, index: number) => ({
							id: index,
							type: resource,
							callsign: null,
							status: 'not disposed',
						})
					),
				}),
		},
	}
);
