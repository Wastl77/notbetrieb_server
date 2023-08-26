import {
	assign,
	createMachine,
	sendTo,
	ActorRefFrom,
	ActorRef,
	fromPromise,
} from 'xstate';
// import { fetchInitialDataMachine } from './fetchInitialData.js';
import { resource } from './resource.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prismaClient.js';

const prismaInitialDb = new PrismaClient({
	datasources: {
		db: {
			url: `${process.env.DATABASE_URL}/notbetrieb_test?directConnection=true`,
		},
	},
});

export const notbetriebRootMachine = createMachine(
	{
		/** @xstate-layout N4IgpgJg5mDOIC5QDkD2AXARmdAnAlmJgAQBKqGAdAJIB2+6+AhgDbGzpPpgDEAYgFEAKgGEAEgFoAygFURIgVKkBtAAwBdRKAAOqWA3ypaWkAA9EAJlUA2SgFZVAdgAcF6wGZnzgIzOb1gBoQAE9Eb1UAFkoIgE446wsIxxjrB1ULAF8soNpUCDgTNCwcAiIyCnQTXX1GIxNzBAlAkMQm7JAi7DxCEnIqOgNWdk5uKr0DOqQzRAiLINCEH2i4mLtHdztvOxjHdfbOkp7yqlhtJgB3WmJcOFQAV1wAYwKp6onjKYb3VcoYmwsYt53BZnHF3I55oglml0rNnBFrK4gVkskA */
		types: {} as {
			//type actors
			input: { resources: Prisma.ResourceCreateManyInput[] }; // input trotzdem nicht strongly typed
			events:
				| {
						type: 'RESOURCE-EVENT';
						params: { callsign: string; eventType: string };
				  }
				| {
						type: 'STATE-1-ENTERED';
						params: { sender: ActorRef<{ type: 'SET-STATUS-1' }, any> };
				  };
			context: {
				isSession: boolean;
				resourceActors: ActorRefFrom<typeof resource>[] | null;
				fetchResult: Prisma.ResourceCreateManyInput[] | null;
			};
		},
		id: 'Notbetrieb Root',
		context: { isSession: false, resourceActors: null, fetchResult: null },
		initial: 'fetchInitialData',
		states: {
			fetchInitialData: {
				invoke: {
					src: 'fetchInitialData',
					onDone: {
						actions: [
							assign({
								resourceActors: ({ event, spawn }) =>
									event.output.map((res: Prisma.ResourceCreateInput) => {
										return spawn(resource, {
											systemId: res.callsign,
											id: res.callsign,
										});
									}),
							}),
							assign({ fetchResult: ({ event }) => event.output }),
						],
						target: 'createSessionDb',
					},
				},
				// 	invoke: {
				// 		id: 'fetchMachine',
				// 		src: fetchInitialDataMachine,
				// 	},
				// 	on: {
				// 		'FETCH-SUCCESS': {
				// 			actions: [
				// assign({
				// 	ref: ({ event, spawn }) =>
				// 		event.params.data.map((res: Prisma.ResourceCreateInput) => {
				// 			return spawn(resource, {
				// 				systemId: res.callsign,
				// 				id: res.callsign,
				// 			});
				// 		}),
				// }),
				// 			],
				// 			target: 'createSessionDb',
				// 		},
				// 		'INITIALIZATION-ERROR': {
				// 			target: 'initializationError',
				// 		},
				// 	},
			},
			initializationError: {
				entry: [() => console.log('Initialization errored')],
				type: 'final',
			},
			createSessionDb: {
				entry: [({ context }) => console.log(context.fetchResult)],
				invoke: {
					// src: 'createSessionDb',
					src: 'createSessionDb',
					input: ({ context }) => ({
						resources: context.fetchResult,
					}),
					onDone: {
						target: 'ready',
					},
				},
			},
			ready: {
				entry: [assign({ isSession: true }), assign({ fetchResult: null })],
				on: {
					'RESOURCE-EVENT': {
						actions: [
							sendTo(
								({ event, system }) => system.get(event.params.callsign),
								({ event }) => {
									return { type: event.params.eventType };
								}
							),
							() => console.log('resource event triggered'),
						],
					},
					'STATE-1-ENTERED': {
						actions: [
							({ event }) =>
								console.log('Message from child ', event.params.sender.id),
						],
					},
				},
			},
		},
	},
	{
		actors: {
			createSessionDb: fromPromise(
				async (
					{ input }: any //TODO typing
				) =>
					await prisma.resource.createMany({
						data: input.resources,
					})
			),
			fetchInitialData: fromPromise(async () => {
				return await prismaInitialDb.resource.findMany();
			}),
		},
	}
);
