import { createMachine, assign, choose } from 'xstate';
import { upgradeAlarmkeyword } from '../util/upgradeAlarmkeyword.js';
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
		on: {
			'UPGRADE-ALARMKEYWORD': {
				actions: ['addUpgradeResources', 'updateAlarmKeyword'],
			},
		},
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
			addUpgradeResources: ({ context, event }) => {
				upgradeAlarmkeyword(context.alarmKeyword, event.params.newKeyword); //! neue units assignen
			},
		},
	}
);
