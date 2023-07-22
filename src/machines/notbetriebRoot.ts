import { assign, createMachine, sendTo } from 'xstate';
import { fetchInitialDataMachine } from './fetchInitialData.js';
import { resource } from './resource.js';
import { Prisma } from '@prisma/client';

export const notbetriebRootMachine = createMachine(
	{
		/** @xstate-layout N4IgpgJg5mDOIC5QDkD2AXARmdAnAlmJgAQBKqGAdAJIB2+6+AhgDbGzpPpgDEAYgFEAKgGEAEgFoAygFURIgVKkBtAAwBdRKAAOqWA3ypaWkAA9EAJlUA2SgFZVAdgAcF6wGZnzgIzOb1gBoQAE9Eb1UAFkoIgE446wsIxxjrB1ULAF8soNpUCDgTNCwcAiIyCnQTXX1GIxNzBAlAkMQm7JAi7DxCEnIqOgNWdk5uKr0DOqQzRAiLINCEH2i4mLtHdztvOxjHdfbOkp7yqlhtJgB3WmJcOFQAV1wAYwKp6onjKYb3VcoYmwsYt53BZnHF3I55oglml0rNnBFrK4gVkskA */
		types: {} as {
			events:
				| { type: 'FETCH-SUCCESS'; data: Prisma.ResourceCreateInput[] }
				| { type: 'INITIALIZATION-ERROR' }
				| { type: 'RESOURCE-EVENT'; callsign: string; eventType: string }
				| { type: 'SESSION-DB-CREATED' };
		},
		id: 'Notbetrieb Root',
		initial: 'initialState',
		states: {
			initialState: {
				invoke: {
					id: 'fetchMachine',
					src: fetchInitialDataMachine,
				},
				on: {
					'FETCH-SUCCESS': {
						actions: [
							// { type: 'logEvent', params: { message: 'fetch success' } },
							() => console.log('fetch success'),
							assign({
								ref: ({ event, spawn }) =>
									event.data.map((res) => {
										return spawn(resource, {
											systemId: res.callsign,
										});
									}),
							}),
						],
					},
					'SESSION-DB-CREATED': {
						target: 'ready',
					},
					'INITIALIZATION-ERROR': {
						target: 'initializationError',
					},
				},
			},
			initializationError: {
				entry: [() => console.log('Initialization errored')],
				type: 'final',
			},
			ready: {
				entry: [
					() => {
						console.log('App ready');
					},
				],
				on: {
					'RESOURCE-EVENT': {
						actions: [
							sendTo(
								({ event, system }) => system.get(event.callsign),
								({ event }) => {
									return { type: event.eventType };
								}
							),
							() => console.log('resource event triggered'),
						],
					},
				},
			},
		},
	}
	// {
	// 	actions: {
	// 		// @ts-ignore
	// 		logEvent: ({ params }) => {
	// 			console.log(params.message);
	// 		},
	// 	},
	// }
);
