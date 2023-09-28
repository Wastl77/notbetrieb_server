import { createMachine, assign } from 'xstate';
import { CreateSceneMachineInput, Scene } from '../../types.js';

export const scene = createMachine(
	{
		types: {} as {
			context: Scene;
			input: CreateSceneMachineInput;
		},
		context: ({ input }) => ({
			...input,
			resourceLines: [],
		}),
		initial: 'open',
		states: {
			open: {
				entry: ['addInitialResources'],
				initial: 'waiting',
				states: {
					waiting: {},
					alarmed: {},
				},
			},
		},
	},
	{
		actions: {
			addInitialResources: ({ context, event }) =>
				assign({
					resourceLines: event.input.initialResources.forEach(
						(resource: string) => {
							context.resourceLines.push({
								index: context.resourceLines.length,
								type: resource,
								callsign: null,
								status: 'not disposed',
							});
						}
					),
				}),
		},
	}
);
