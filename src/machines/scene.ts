import { createMachine, assign } from 'xstate';
import { upgradeAlarmkeyword } from '../util/upgradeAlarmkeyword.js';
import { differentiateResources } from '../util/differentiateResources.js';
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
				const totalResources = upgradeAlarmkeyword(
					context.alarmKeyword,
					event.params.newKeyword
				);
				const actualResources: string[] = [];
				context.resourceLines.forEach((line) => {
					line.status !== 'finished' && line.status !== 'not neccessary'
						? actualResources.push(line.type)
						: null;
				});
				const resourcesToAdd = differentiateResources(
					actualResources,
					totalResources
				);
				assign({
					resourceLines: resourcesToAdd.forEach((resource: string) => {
						context.resourceLines.push({
							index: context.resourceLines.length,
							type: resource,
							callsign: null,
							status: 'not disposed',
						});
					}),
				});
			},
		},
	}
);
