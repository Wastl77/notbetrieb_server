import { assign, createMachine, sendTo } from 'xstate';
import { fetchInitialDataMachine } from './fetchInitialData.js';
import { resource } from './resource.js';
import { Resource } from '../data/resources.js';

export const notbetriebRootMachine = createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QDkD2AXARmdAnAlmJgAQBKqGAdAJIB2+6+AhgDbGzpPpgDEAYgFEAKgGEAEgFoAygFURIgVKkBtAAwBdRKAAOqWA3ypaWkAA9EAJlUA2SgFZVAdgAcF6wGZnzgIzOb1gBoQAE9Eb1UAFkoIgE446wsIxxjrB1ULAF8soNpUCDgTNCwcAiIyCnQTXX1GIxNzBAlAkMQm7JAi7DxCEnIqOgNWdk5uKr0DOqQzRAiLINCEH2i4mLtHdztvOxjHdfbOkp7yqlhtJgB3WmJcOFQAV1wAYwKp6onjKYb3VcoYmwsYt53BZnHF3I55oglml0rNnBFrK4gVkskA */
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
					target: 'ready',
					actions: [
						({ event }) => console.log('fetch success event', event.data),
						assign({
							ref: ({ event, spawn }) =>
								event.data.map((res: Resource) => {
									return spawn(resource, {
										systemId: res.callsign,
									});
								}),
						}),
					],
				},
				'FETCH-ERROR': {
					target: 'fetchError',
				},
			},
		},
		fetchError: { entry: [() => console.log('Fetch errored')], type: 'final' },
		ready: {
			entry: [
				({ event }) => {
					console.log('spawn State:', event.output);
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
	types: {},
});
