import {
	assign,
	createMachine,
	sendTo,
	ActorRefFrom,
	fromPromise,
} from 'xstate';
import { resource } from './resource.js';
import { scene } from './scene.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prismaClient.js';
import { SceneInputType } from '../../types.js';

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
						type: 'CREATE-SCENE';
						params: SceneInputType;
				  };
			context: {
				isSession: boolean;
				resourceActors: ActorRefFrom<typeof resource>[] | null;
				sceneActor: ActorRefFrom<typeof scene> | null;
				fetchResult: Prisma.ResourceCreateManyInput[] | null;
				sceneNumber: number;
			};
		},
		id: 'Notbetrieb Root',
		context: {
			isSession: false,
			resourceActors: null,
			sceneActor: null,
			fetchResult: null,
			sceneNumber: 1,
		},
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
					onError: {
						actions: [() => console.log('Error fetching initial data')],
						target: 'fetchError',
					},
				},
			},
			createSessionDb: {
				invoke: {
					src: 'createSessionDb',
					input: ({ context }) => ({
						resources: context.fetchResult,
					}),
					onDone: {
						target: 'ready',
					},
				},
			},
			fetchError: {
				//TODO add abort controller when implemented by xstate
				after: {
					3000: {
						target: 'fetchInitialData',
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
					'CREATE-SCENE': {
						actions: [
							assign({
								sceneActor: ({ event, context, spawn }) => {
									return spawn(scene, {
										input: {
											adress: {
												street: event.params.adress.street,
												object: event.params.adress.object,
												district: event.params.adress.district,
											},
											alarmKeyword: event.params.alarmKeyword,
											resources: event.params.resources,
											sceneNumber: context.sceneNumber,
										},
									});
								},
								sceneNumber: ({ context }) => context.sceneNumber + 1,
							}),
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
				// return new Promise((resolve, reject) => setTimeout(reject, 3000));
			}),
		},
	}
);
