import { createMachine } from 'xstate';
import { CreateSceneInput, Scene } from '../../types.js';

export const scene = createMachine(
	{
		types: {} as {
			context: Scene;
			input: CreateSceneInput;
		},
		context: ({ input }) => ({
			...input,
			resourceLines: [],
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
