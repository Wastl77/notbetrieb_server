import { setup, assign, raise, sendTo, enqueueActions } from 'xstate';
import { upgradeAlarmkeyword } from '../util/upgradeAlarmkeyword.js';
import { differentiateResources } from '../util/differentiateResources.js';
import {
	CreateSceneMachineInput,
	Scene,
	ResourceLineStatus,
} from '../../types.js';

export const scene = setup({
	types: {} as {
		context: Scene;
		input: CreateSceneMachineInput;
		events: {
			type:
				| 'ADD-RESOURCE-MANUAL'
				| 'UPGRADE-ALARMKEYWORD'
				| 'DISPOSE-RESOURCE-REQUEST'
				| 'CHECK-SCENE-ALARMED'
				| 'CHECK-SCENE-LEFT'
				| 'CHECK-SCENE-FINISHED'
				| 'CHECK-SCENE-DISPOSED'
				| 'RESOURCE-ALARMED'
				| 'RESOURCE-IN-STATUS-3'
				| 'RESOURCE-IN-STATUS-4'
				| 'RESOURCE-LEFT-SCENE'
				| 'RESOURCE-FINISHED';
			params: {
				type: string;
				newKeyword: string;
				resourceLineIndex: string;
				callsign: string;
				newStatus: ResourceLineStatus;
			};
		};
	},
	actions: {
		addInitialResources: ({ context }) => {
			assign({
				resourceLines: context.initialResources.forEach((resource: string) => {
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
			//! für bereits disponierte Zeile bei man. Dispo resourceLineIndex in params hinzufügen
			assign({
				resourceLines: context.resourceLines.push({
					index: context.resourceLines.length,
					type: event.params.type,
					disposedType: event.params.type,
					callsign: event.params.callsign,
					status: 'disposed',
				}),
			});
		},
		sendResourceAddedManual: sendTo(
			({ system, event }) => system.get(event.params.callsign),
			({ context }) => {
				return {
					type: 'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL',
					params: {
						resourceLineIndex: context.resourceLines.length - 1,
						sceneNumber: context.sceneNumber,
					},
				};
			}
		),
		disposeResource: ({ context, event }) => {
			const { resourceLineIndex, type, callsign } = event.params;
			assign({
				resourceLines: (context.resourceLines[+resourceLineIndex] = {
					...context.resourceLines[+resourceLineIndex],
					callsign,
					disposedType: type,
					status: 'disposed',
				}),
			});
		},
		cancelResource: sendTo(
			({ context, system, event }) =>
				system.get(
					`${context.resourceLines[+event.params.resourceLineIndex].callsign}` //! hier statt das über self zurück senden?
				),
			() => {
				return {
					type: 'CANCEL-RESOURCE',
				};
			}
		),
		updateAlarmKeywordInContext: () => {
			return null;
		}, //! noch imlementieren
		setResourceLineStatus: ({ context, event }) => {
			const { resourceLineIndex, newStatus } = event.params;
			assign({
				resourceLines: (context.resourceLines[+resourceLineIndex] = {
					...context.resourceLines[+resourceLineIndex],
					status: newStatus,
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
				(line) => line.status === 'finished' || line.status === 'not neccessary'
			);
		},
	},
}).createMachine({
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
							type: 'sendResourceAddedManual',
						},
						//@ts-ignore
						raise({ type: 'CHECK-SCENE-ALARMED' }),
						//@ts-ignore
						raise({ type: 'CHECK-SCENE-DISPOSED' }),
					],
				},
				'UPGRADE-ALARMKEYWORD': {
					actions: [
						{
							type: 'addUpgradeResources',
						},
						{
							type: 'updateAlarmKeywordInContext', //! muss noch gemacht werden
						},
						//@ts-ignore
						raise({ type: 'CHECK-SCENE-ALARMED' }),
						//@ts-ignore
						raise({ type: 'CHECK-SCENE-DISPOSED' }),
					],
				},
				'DISPOSE-RESOURCE-REQUEST': {
					actions: enqueueActions(({ context, event, enqueue }: any) => {
						if (
							context.resourceLines[event.params.resourceLineIndex].status !==
							'not disposed'
						) {
							enqueue({
								type: 'cancelResource',
								params: event.params.resourceLineIndex,
							});
							enqueue({
								type: 'disposeResource',
								params: {
									resourceLineIndex: event.params.resourceLineIndex,
									type: event.params.type,
									callsign: event.params.callsign,
								},
							});
							enqueue.sendTo(event.params.sender, {
								type: 'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL',
								params: {
									resourceLineIndex: event.params.resourceLineIndex,
									sceneNumber: context.sceneNumber,
								},
							});
							enqueue.raise({ type: 'CHECK-SCENE-DISPOSED' });
						} else if (
							context.resourceLines[event.params.resourceLineIndex].status ===
								'not disposed' ||
							context.resourceLines[event.params.resourceLineIndex].status ===
								'disposed' ||
							context.resourceLines[event.params.resourceLineIndex].status ===
								'alarmed' ||
							context.resourceLines[event.params.resourceLineIndex].status ===
								'cancelled'
						) {
							enqueue({
								type: 'disposeResource',
								params: {
									resourceLineIndex: event.params.resourceLineIndex,
									type: event.params.type,
									callsign: event.params.callsign,
								},
							});
							enqueue.sendTo(event.params.sender, {
								type: 'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL',
								params: {
									resourceLineIndex: event.params.resourceLineIndex,
									sceneNumber: context.sceneNumber,
								},
							});
							enqueue.raise({ type: 'CHECK-SCENE-DISPOSED' });
						}
					}),
				},
				'RESOURCE-LEFT-SCENE': {
					actions: [
						{
							type: 'setResourceLineStatus',
						},
						//@ts-ignore
						raise({ type: 'CHECK-SCENE-LEFT' }),
					],
				},
				'RESOURCE-FINISHED': {
					actions: [
						{
							type: 'setResourceLineStatus',
						},
						//@ts-ignore
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
											type: 'setResourceLineStatus',
										},
										//@ts-ignore
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
								target: '.alarmed',
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
							actions: {
								type: 'setResourceLineStatus',
							},
							target: '.onApproach',
						},
						'RESOURCE-IN-STATUS-4': {
							actions: {
								type: 'setResourceLineStatus',
							},
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
});
