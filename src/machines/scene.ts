import { createMachine, assign, raise } from 'xstate';
import { upgradeAlarmkeyword } from '../util/upgradeAlarmkeyword.js';
import { differentiateResources } from '../util/differentiateResources.js';
import { CreateSceneMachineInput, Scene } from '../../types.js';

export const scene = createMachine(
	{
		types: {} as {
			context: Scene;
			input: CreateSceneMachineInput;
			actions: {
				type:
					| 'addUpgradeResources'
					| 'updateAlarmKeyword'
					| 'disposeResource'
					| 'addInitialResources'
					| 'setAlarmedStatus';
			};
			guards: { type: 'isAllResourcesAlarmed' };
			// events:
			// 	| {
			// 			type: 'UPGRADE-ALARMKEYWORD';
			// 			params: { newKeyword: string };
			// 	  }
			// 	| {
			// 			type: 'DISPOSE-RESOURCE';
			// 			params: { sceneNumber: string; resourceLineIndex: string };
			// 	  };
		},
		context: ({ input }) => ({
			...input,
			resourceLines: [],
		}),
		initial: 'open',
		on: {
			'UPGRADE-ALARMKEYWORD': {
				actions: ['addUpgradeResources', 'updateAlarmKeyword'], //!updateAlarmkeyword muss noch gemacht werden
			},
			'DISPOSE-RESOURCE': {
				actions: ['disposeResource'],
			},
		},
		states: {
			open: {
				entry: ['addInitialResources'],
				initial: 'waiting',
				on: {
					'CHECK-SCENE-ALARMED': {
						guard: 'isAllResourcesAlarmed',
						target: '.alarmed',
					},
				},
				states: {
					waiting: {
						on: {
							'RESOURCE-ALARMED': {
								actions: [
									'setAlarmedStatus',
									raise({ type: 'CHECK-SCENE-ALARMED' }),
								],
							},
						},
					},
					alarmed: {},
				},
			},
		},
	},
	{
		actions: {
			addInitialResources: ({ context }) =>
				assign({
					resourceLines: context.initialResources.forEach(
						(resource: string) => {
							context.resourceLines.push({
								index: context.resourceLines.length,
								type: resource,
								disposedType: null,
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
							disposedType: null,
							callsign: null,
							status: 'not disposed',
						});
					}),
				});
			},
			disposeResource: ({ context, event }) => {
				const { resourceLineIndex, type, callsign } = event.params;
				console.log(resourceLineIndex, type);
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						callsign,
						disposedType: type,
						status: 'disposed',
					}),
				});
			},
			setAlarmedStatus: ({ context, event }) => {
				const { resourceLineIndex } = event.params;
				console.log('setAlarmedStatus action drinnen');
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						status: 'alarmed',
					}),
				});
			},
		},
		guards: {
			isAllResourcesAlarmed: ({ context }) => {
				return context.resourceLines.every((line) => line.status === 'alarmed');
			},
		},
	}
);
