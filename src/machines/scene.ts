import { createMachine } from 'xstate';
import { SceneInputType } from '../../types.js';

export const scene = createMachine(
	{
		types: {} as {
			context: {
				address: {
					//TODO type ScenInputType mergen, dass hier alles doppelte weg kann
					street: string;
					object?: string;
					district?: string;
				};
				alarmKeyword: string;
				resourceLines?: {
					id: number;
					type: string;
					callsign: string | null;
					status: 'not disposed' | 'disposed' | 'cancelled';
					cancelledCallsign?: string;
				}[];
				sceneNumber: number;
			};
			input: SceneInputType;
		},
		context: ({ input }): any => ({
			address: { ...input.address },
			alarmKeyword: input.alarmKeyword,
			resourceLines: [],
			sceneNumber: input.sceneNumber,
		}),
		initial: 'openScene',
		states: {
			openScene: {
				// entry: ['resolveResources'],
				initial: 'waitingScene',
				states: {
					waitingScene: {},
					alarmedScene: {},
				},
			},
		},
	}
	// {
	// 	actions: {
	// 		resolveResources: ({ event }) =>
	// 			assign({
	// 				resourceLines: event.input.resources.map(
	// 					(resource: string, index: number) => ({
	// 						id: index,
	// 						type: resource,
	// 						callsign: null,
	// 						status: 'not disposed',
	// 					})
	// 				),
	// 			}),
	// 	},
	// }
);
