import { createMachine, sendTo, assign } from 'xstate';

export const resource = createMachine(
	{
		types: {} as {
			//! Events mit verschiedenen properties fragen bei discord
			events: {
				type:
					| 'DISPOSE-RESOURCE'
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
				| { type: 'sendResourceAlarmed' };
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
							'DISPOSE-RESOURCE': {
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
						},
					},
					R3: {
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
						on: {
							'SET-STATUS-7': {
								target: 'R7',
							},
							'SET-STATUS-EA': {
								target: 'EA',
							},
						},
					},
					EA: {
						on: {
							'SET-STATUS-1': {
								target: '#resource.available.D1',
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
								target: '#resource.available.D1',
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
		},
	}
);
