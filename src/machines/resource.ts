import { createMachine, sendTo, assign } from 'xstate';
import { rootActor } from '../app.js';

export const resource = createMachine(
	{
		types: {} as {
			//! Events mit verschiedenen properties fragen bei discord
			events: {
				type:
					| 'DISPOSE-RESOURCE'
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
			actions:
				| { type: 'resourceDisposed' }
				| { type: 'setActualScene' }
				| { type: 'resetScene' }
				| { type: 'sendResourceAlarmed' }
				| { type: 'sendResourceInStatus3' }
				| { type: 'sendResourceInStatus4' }
				| { type: 'sendResourceLeftScene' }
				| { type: 'sendResourceFinished' };
			input: { resourceType: string; callsign: string };
			context: {
				resourceType: string;
				callsign: string;
				sceneNumber: string | null;
				resourceLineIndex: string | null;
			};
		},
		context: ({ input }) => ({
			resourceType: input.resourceType,
			callsign: input.callsign,
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
							'DISPOSE-RESOURCE': {
								guard: 'isResourceLineDisposable',
								target: '#resource.reserved.R2', //! hier guard?
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
							'DISPOSE-RESOURCE': {
								guard: 'isResourceLineDisposable',
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
							'DISPOSE-RESOURCE': {
								guard: 'isResourceLineDisposable',
								target: '#resource.reserved.R1',
							},
							'SET-STATUS-2': {
								target: '#resource.available.D2',
							},
							'SET-STATUS-Ü1': {
								target: '#resource.Ü-Pool.Ü1',
							},
						},
						exit: { type: 'sendResourceFinished' }, //! hier noch resetScene action einfügen
					},
				},
			},
			reserved: {
				initial: 'R2',
				states: {
					R2: {
						entry: [
							{
								type: 'setActualScene',
							},
							{
								type: 'resourceDisposed',
							},
						],
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
							type: 'sendResourceAlarmed',
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
					R3: {
						entry: {
							type: 'sendResourceInStatus3',
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
							type: 'sendResourceInStatus4',
						},
						exit: {
							type: 'sendResourceLeftScene',
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
					R1: {
						entry: [
							{
								type: 'setActualScene',
							},
							{
								type: 'resourceDisposed',
							},
						],
						on: {
							'SET-STATUS-QT': {
								target: 'R1(Qt)',
							},
							'CANCEL-RESOURCE': {
								actions: { type: 'resetScene' },
								target: '#resource.available.D2',
							},
						},
					},
					'R1(Qt)': {
						entry: {
							type: 'sendResourceAlarmed',
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
	},
	{
		actions: {
			resourceDisposed: sendTo(
				({ event, system }) =>
					system.get(`sceneNumber${event.params.sceneNumber}`),
				({ context, event }) => {
					return {
						type: 'DISPOSE-RESOURCE',
						params: {
							resourceLineIndex: event.params.resourceLineIndex,
							type: context.resourceType,
							callsign: context.callsign,
						},
					};
				}
			),
			setActualScene: assign({
				sceneNumber: ({ event }) => event.params.sceneNumber,
				resourceLineIndex: ({ event }) => event.params.resourceLineIndex,
			}),
			resetScene: assign({
				sceneNumber: null,
				resourceLineIndex: null,
			}),
			sendResourceAlarmed: sendTo(
				({ system, context }) =>
					system.get(`sceneNumber${context.sceneNumber}`),
				({ context }) => {
					return {
						type: 'RESOURCE-ALARMED',
						params: {
							resourceLineIndex: context.resourceLineIndex,
						},
					};
				}
			),
			sendResourceInStatus3: sendTo(
				({ system, context }) =>
					system.get(`sceneNumber${context.sceneNumber}`),
				({ context }) => {
					return {
						type: 'RESOURCE-IN-STATUS-3',
						params: {
							resourceLineIndex: context.resourceLineIndex,
						},
					};
				}
			),
			sendResourceInStatus4: sendTo(
				({ system, context }) =>
					system.get(`sceneNumber${context.sceneNumber}`),
				({ context }) => {
					return {
						type: 'RESOURCE-IN-STATUS-4',
						params: {
							resourceLineIndex: context.resourceLineIndex,
						},
					};
				}
			),
			sendResourceLeftScene: sendTo(
				({ system, context }) =>
					system.get(`sceneNumber${context.sceneNumber}`),
				({ context }) => {
					return {
						type: 'RESOURCE-LEFT-SCENE',
						params: {
							resourceLineIndex: context.resourceLineIndex,
						},
					};
				}
			),
			sendResourceFinished: sendTo(
				({ system, context }) =>
					system.get(`sceneNumber${context.sceneNumber}`),
				({ context }) => {
					return {
						type: 'RESOURCE-FINISHED',
						params: {
							resourceLineIndex: context.resourceLineIndex,
						},
					};
				}
			),
		},
		guards: {
			isResourceLineDisposable: ({ event }) => {
				const context: any = rootActor
					.getSnapshot()
					.children[
						`sceneNumber${event.params.sceneNumber}`
					].getSnapshot().context;
				return (
					context.resourceLines[event.params.resourceLineIndex].status ===
						'not disposed' ||
					context.resourceLines[event.params.resourceLineIndex].status ===
						'disposed' ||
					context.resourceLines[event.params.resourceLineIndex].status ===
						'alarmed' ||
					context.resourceLines[event.params.resourceLineIndex].status ===
						'cancelled'
				);
			},
		},
	}
);
