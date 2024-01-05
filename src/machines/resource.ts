import { setup, sendTo, assign } from 'xstate';
import { ResourceLineStatus } from '../../types.js';

export const resource = setup({
	types: {} as {
		events: {
			type:
				| 'DISPOSE-RESOURCE-REQUEST'
				| 'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL'
				| 'CANCEL-RESOURCE'
				| 'SET-STATUS-QT'
				| 'SET-STATUS-1'
				| 'SET-STATUS-2'
				| 'SET-STATUS-3'
				| 'SET-STATUS-4'
				| 'SET-STATUS-7'
				| 'SET-STATUS-8'
				| 'SET-STATUS-Ü1'
				| 'SET-STATUS-Ü2'
				| 'SET-STATUS-EA';
			params: {
				sceneNumber: string;
				resourceLineIndex: string;
				callsign: string;
			};
		};
		input: {
			type: string;
			callsign: string;
			area: string;
		};
		context: {
			type: string;
			callsign: string;
			area: string;
			sceneNumber: string | null;
			resourceLineIndex: string | null;
		};
	},
	actions: {
		setActualScene: assign({
			sceneNumber: ({ event }) => event.params.sceneNumber,
			resourceLineIndex: ({ event }) => event.params.resourceLineIndex,
		}),
		resetScene: assign({
			sceneNumber: null,
			resourceLineIndex: null,
		}),
		sendResourceStatusToScene: sendTo(
			({ system, context }) => system.get(`sceneNumber${context.sceneNumber}`),
			(
				{ context },
				params: { eventType: string; newStatus: ResourceLineStatus }
			) => {
				return {
					type: params.eventType,
					params: {
						resourceLineIndex: context.resourceLineIndex,
						newStatus: params.newStatus,
					},
				};
			}
		),
		sendDisposeResourceRequestToScene: sendTo(
			({ system, event }) =>
				system.get(`sceneNumber${event.params.sceneNumber}`),
			({ context, event, self }) => {
				return {
					type: 'DISPOSE-RESOURCE-REQUEST',
					params: {
						resourceLineIndex: event.params.resourceLineIndex,
						type: context.type,
						callsign: context.callsign,
						sender: self,
					},
				};
			}
		),
	},
}).createMachine({
	context: ({ input }) => ({
		type: input.type,
		callsign: input.callsign,
		area: input.area,
		resourceLineIndex: null,
		sceneNumber: null,
	}),
	id: 'resource',
	initial: 'available',
	states: {
		available: {
			initial: 'D2',
			states: {
				D2: {
					on: {
						'DISPOSE-RESOURCE-REQUEST': {
							actions: {
								type: 'sendDisposeResourceRequestToScene',
							},
						},
						'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL': {
							actions: {
								type: 'setActualScene',
							},
							target: '#resource.reserved.R2',
						},
						'SET-STATUS-1': {
							target: 'D1',
						},
						'SET-STATUS-Ü2': {
							target: '#resource.Ü-Pool.Ü2',
						},
					},
				},
				D1: {
					on: {
						'DISPOSE-RESOURCE-REQUEST': {
							actions: {
								type: 'sendDisposeResourceRequestToScene',
							},
						},
						'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL': {
							actions: {
								type: 'setActualScene',
							},
							target: '#resource.reserved.R1',
						},
						'SET-STATUS-2': {
							target: 'D2',
						},
						'SET-STATUS-Ü1': {
							target: '#resource.Ü-Pool.Ü1',
						},
					},
				},
			},
		},
		availableOnReturn: {
			initial: 'D1',
			states: {
				D1: {
					on: {
						'DISPOSE-RESOURCE-REQUEST': {
							actions: {
								type: 'sendDisposeResourceRequestToScene',
							},
						},
						'DISPOSE-RESOURCE-REQUEST-SUCCESSFUL': {
							actions: {
								type: 'setActualScene',
							},
							target: '#resource.reserved.R1',
						},
						'SET-STATUS-2': {
							target: '#resource.available.D2',
						},
						'SET-STATUS-Ü1': {
							target: '#resource.Ü-Pool.Ü1',
						},
					},
					exit: [
						{
							type: 'sendResourceStatusToScene',
							params: {
								eventType: 'RESOURCE-FINISHED',
								newStatus: 'finished',
							},
						},
						{
							type: 'resetScene',
						},
					],
				},
			},
		},
		reserved: {
			initial: 'R2',
			states: {
				R2: {
					on: {
						'SET-STATUS-QT': {
							target: 'R2(Qt)',
						},
						'CANCEL-RESOURCE': {
							actions: { type: 'resetScene' },
							target: '#resource.available.D2',
						},
					},
				},
				'R2(Qt)': {
					entry: {
						type: 'sendResourceStatusToScene',
						params: { eventType: 'RESOURCE-ALARMED', newStatus: 'alarmed' },
					},
					on: {
						'SET-STATUS-3': {
							target: 'R3',
						},
						'CANCEL-RESOURCE': {
							actions: { type: 'resetScene' },
							target: '#resource.available.D2',
						},
					},
				},
				R1: {
					on: {
						'SET-STATUS-QT': {
							target: 'R1(Qt)',
						},
						'CANCEL-RESOURCE': {
							actions: { type: 'resetScene' },
							target: '#resource.available.D1',
						},
					},
				},
				'R1(Qt)': {
					entry: {
						type: 'sendResourceStatusToScene',
						params: { eventType: 'RESOURCE-ALARMED', newStatus: 'alarmed' },
					},
					on: {
						'SET-STATUS-3': {
							target: 'R3',
						},
						'CANCEL-RESOURCE': {
							actions: { type: 'resetScene' },
							target: '#resource.available.D1',
						},
					},
				},
				R3: {
					entry: {
						type: 'sendResourceStatusToScene',
						params: {
							eventType: 'RESOURCE-IN-STATUS-3',
							newStatus: 'on approach',
						},
					},
					on: {
						'SET-STATUS-4': {
							target: 'R4',
						},
						'SET-STATUS-EA': {
							target: 'EA',
						},
					},
				},
				R4: {
					entry: {
						type: 'sendResourceStatusToScene',
						params: {
							eventType: 'RESOURCE-IN-STATUS-4',
							newStatus: 'on scene',
						},
					},
					exit: {
						type: 'sendResourceStatusToScene',
						params: {
							eventType: 'RESOURCE-LEFT-SCENE',
							newStatus: 'left scene',
						},
					},
					on: {
						'SET-STATUS-7': {
							target: 'R7',
						},
						'SET-STATUS-EA': {
							target: 'EA',
						},
						'SET-STATUS-1': {
							target: '#resource.availableOnReturn.D1',
						},
					},
				},
				EA: {
					on: {
						'SET-STATUS-1': {
							target: '#resource.availableOnReturn.D1',
						},
					},
				},
				R7: {
					on: {
						'SET-STATUS-8': {
							target: 'R8',
						},
					},
				},
				R8: {
					on: {
						'SET-STATUS-Ü1': {
							target: '#resource.Ü-Pool.Ü1',
						},
						'SET-STATUS-1': {
							target: '#resource.availableOnReturn.D1',
						},
					},
				},
			},
		},
		'Ü-Pool': {
			initial: 'Ü2',
			states: {
				Ü2: {
					on: {
						'SET-STATUS-2': {
							target: '#resource.available.D2',
						},
					},
				},
				Ü1: {
					on: {
						'SET-STATUS-1': {
							target: '#resource.available.D1',
						},
					},
				},
			},
		},
	},
});

// function persistResourceInDb(resourceActorLogic: any) {
// 	const enhancedResourceLogic = {
// 		...resourceActorLogic,
// 		transition: (state: any, event: any, actorCtx: any) => {
// 			console.log('State:', state);
// 			console.log('Event:', event);
// 			console.log('Context:', actorCtx);
// 			return resourceActorLogic.transition(state, event, actorCtx);
// 		},
// 	};
// 	return enhancedResourceLogic;
// }

// export const resource = persistResourceInDb(resourceMachine);
