import {
	createMachine,
	assign,
	raise,
	sendTo,
	choose,
	pure,
	AnyEventObject,
} from 'xstate';
import { upgradeAlarmkeyword } from '../util/upgradeAlarmkeyword.js';
import { differentiateResources } from '../util/differentiateResources.js';
import { CreateSceneMachineInput, Scene } from '../../types.js';

export const scene = createMachine(
	// testen ob upgrade alarmkeyword->raise checkscenealarmed geht, disposeResource->raise checkSceneDisposed?
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
					| 'setAlarmedStatus'
					| 'setResourceDisposed'
					| 'addResourceManual'
					| 'cancelResource'
					| 'setResourceLeftSceneStatus'
					| 'setResourceOnApproachStatus'
					| 'setResourceOnSceneStatus'
					| 'setResourceFinishedStatus';
			};
			guards: {
				type:
					| 'allResourcesAlarmed'
					| 'allResourcesDisposed'
					| 'allResourcesLeftScene'
					| 'allResourcesFinished';
			};
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
		id: 'scene',
		initial: 'open',
		states: {
			open: {
				entry: {
					type: 'addInitialResources',
				},
				on: {
					'ADD-RESOURCE-MANUAL': {
						actions: [
							{
								type: 'addResourceManual',
							},
							{
								type: 'setResourceDisposed',
							},
							raise({ type: 'CHECK-SCENE-ALARMED' }),
							raise({ type: 'CHECK-SCENE-DISPOSED' })+´
						],
					},
					'UPGRADE-ALARMKEYWORD': {
						actions: [
							{
								type: 'addUpgradeResources',
							},
							{
								type: 'updateAlarmKeyword', //! muss noch gemacht werden
							},
							raise({ type: 'CHECK-SCENE-ALARMED' }),
							raise({ type: 'CHECK-SCENE-DISPOSED' }),
						],
					},
					'DISPOSE-RESOURCE': {
						actions: pure(
							({ context, event }: { context: any; event: AnyEventObject }) => {
								if (
									context.resourceLines[event.params.resourceLineIndex]
										.status !== 'not disposed'
								) {
									console.log('im cancel if branch');
									return [
										'cancelResource',
										'disposeResource',
										raise({ type: 'CHECK-SCENE-DISPOSED' }),
									];
								} else if (
									context.resourceLines[event.params.resourceLineIndex]
										.status === 'not disposed' ||
									context.resourceLines[event.params.resourceLineIndex]
										.status === 'disposed' ||
									context.resourceLines[event.params.resourceLineIndex]
										.status === 'alarmed' ||
									context.resourceLines[event.params.resourceLineIndex]
										.status === 'cancelled'
								) {
									console.log('im nicht cancel if branch');
									return [
										'disposeResource',
										raise({ type: 'CHECK-SCENE-DISPOSED' }),
									];
								}
							}
						),
					},
					'RESOURCE-LEFT-SCENE': {
						actions: [
							{ type: 'setResourceLeftSceneStatus' },
							raise({ type: 'CHECK-SCENE-LEFT' }),
						],
					},
					'RESOURCE-FINISHED': {
						actions: [
							{ type: 'setResourceFinishedStatus' },
							raise({ type: 'CHECK-SCENE-FINISHED' }),
						],
					},
				},
				states: {
					waitingState: {
						initial: 'waiting',
						states: {
							waiting: {
								on: {
									'RESOURCE-ALARMED': {
										target: 'waiting',
										actions: [
											{
												type: 'setAlarmedStatus',
											},
											raise({ type: 'CHECK-SCENE-ALARMED' }),
										],
									},
								},
							},
							alarmed: {},
						},
						on: {
							'CHECK-SCENE-ALARMED': [
								{
									target: '.alarmed', // dann upgradealarmkeyword, evtl. über websocket oder request.body
									guard: 'allResourcesAlarmed',
								},
								{
									target: '.waiting',
								},
							],
						},
					},
					sceneState: {
						initial: 'disposing',
						states: {
							disposing: {},
							disposed: {},
							onApproach: {},
							onScene: {
								on: {
									'CHECK-SCENE-LEFT': [
										{
											target: 'noResourcesOnScene',
											guard: 'allResourcesLeftScene',
										},
										{
											target: 'onScene',
										},
									],
								},
							},
							noResourcesOnScene: {
								on: {
									'CHECK-SCENE-FINISHED': [
										{
											target: '#scene.finished',
											guard: 'allResourcesFinished',
										},
										{
											target: 'noResourcesOnScene',
										},
									],
								},
							},
						},
						on: {
							'RESOURCE-IN-STATUS-3': {
								actions: { type: 'setResourceOnApproachStatus' },
								target: '.onApproach',
							},
							'RESOURCE-IN-STATUS-4': {
								actions: { type: 'setResourceOnSceneStatus' },
								target: '.onScene',
							},
							'CHECK-SCENE-DISPOSED': [
								{
									target: '.disposed',
									guard: 'allResourcesDisposed',
								},
								{
									target: '.disposing',
								},
							],
						},
					},
				},
				type: 'parallel',
			},
			finished: {},
		},
	},
	{
		actions: {
			addInitialResources: ({ context }) => {
				console.log('add Initial Resources');
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
				});
			},
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
			addResourceManual: ({ context, event }) => {
				console.log('im add manual action');
				assign({
					resourceLines: context.resourceLines.push({
						index: context.resourceLines.length,
						type: event.params.type,
						disposedType: null,
						callsign: null,
						status: 'not disposed',
					}),
				});
			},
			disposeResource: ({ context, event }) => {
				const { resourceLineIndex, type, callsign } = event.params;
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
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						status: 'alarmed',
					}),
				});
			},
			setResourceDisposed: sendTo(
				({ event, system }) => system.get(event.params.callsign),
				({ context }) => {
					return {
						type: 'DISPOSE-RESOURCE',
						params: {
							sceneNumber: context.sceneNumber,
							resourceLineIndex: context.resourceLines.length - 1,
						},
					};
				}
			),
			cancelResource: sendTo(
				({ context, event, system }) =>
					system.get(
						`${context.resourceLines[event.params.resourceLineIndex].callsign}`
					),
				() => {
					return {
						type: 'CANCEL-RESOURCE',
					};
				}
			),
			setResourceLeftSceneStatus: ({ context, event }) => {
				const { resourceLineIndex } = event.params;
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						status: 'left scene',
					}),
				});
			},
			setResourceFinishedStatus: ({ context, event }) => {
				const { resourceLineIndex } = event.params;
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						status: 'finished',
					}),
				});
			},
			setResourceOnApproachStatus: ({ context, event }) => {
				const { resourceLineIndex } = event.params;
				console.log(resourceLineIndex);
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						status: 'on approach',
					}),
				});
			},
			setResourceOnSceneStatus: ({ context, event }) => {
				const { resourceLineIndex } = event.params;
				console.log(resourceLineIndex);
				assign({
					resourceLines: (context.resourceLines[resourceLineIndex] = {
						...context.resourceLines[resourceLineIndex],
						status: 'on scene',
					}),
				});
			},
		},
		guards: {
			allResourcesAlarmed: ({ context }) => {
				return context.resourceLines.every(
					(line) =>
						line.status === 'alarmed' ||
						line.status === 'not neccessary' ||
						line.status === 'finished' ||
						line.status === 'on scene' ||
						line.status === 'left scene'
				);
			},
			allResourcesDisposed: ({ context }) => {
				return context.resourceLines.every(
					(line) =>
						line.status === 'alarmed' ||
						line.status === 'not neccessary' ||
						line.status === 'finished' ||
						line.status === 'on scene' ||
						line.status === 'disposed' ||
						line.status === 'left scene'
				);
			},
			allResourcesLeftScene: ({ context }) => {
				return context.resourceLines.every(
					(line) =>
						line.status === 'left scene' ||
						line.status === 'finished' ||
						line.status === 'not neccessary'
				);
			},
			allResourcesFinished: ({ context }) => {
				return context.resourceLines.every(
					(line) =>
						line.status === 'finished' || line.status === 'not neccessary'
				);
			},
		},
	}
);
