import { createMachine, sendTo, assign } from 'xstate';

export const resource = createMachine(
	{
		types: {} as {
			//! Events mit verschiedenen properties fragen bei discord
			events: {
				type: 'DISPOSE-RESOURCE' | 'SET-STATUS-QT' | 'RESOURCE-ALARMED';
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
						},
					},
				},
			},
			reserved: {
				initial: 'R2',
				states: {
					R2: {
						entry: ['setActualScene', 'resourceDisposed'],
						on: { 'SET-STATUS-QT': { target: 'R2(Qt)' } },
					},
					'R2(Qt)': { entry: ['sendResourceAlarmed'] },
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
