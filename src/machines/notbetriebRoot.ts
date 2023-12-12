import { assign, sendTo, ActorRefFrom, fromPromise, setup } from 'xstate';
import { resource } from './resource.js';
import { scene } from './scene.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prismaClient.js';
import { CreateSceneMachineInput } from '../../types.js';

// see https://github.com/statelyai/xstate/blob/next/examples/friends-list-react/src/friends.machine.ts

const prismaInitialDb = new PrismaClient({
	datasources: {
		db: {
			url: `${process.env.DATABASE_URL}/notbetrieb_test?directConnection=true`,
		},
	},
});

const createSessionDb = fromPromise(
	async ({ input }: { input: Prisma.ResourceCreateManyInput[] }) =>
		await prisma.resource.createMany({
			data: input,
		})
);

const fetchInitialData = fromPromise(async () => {
	return await prismaInitialDb.resource.findMany();
});

export const notbetriebRootMachine = setup({
	types: {} as {
		events:
			| {
					type: 'RESOURCE-EVENT';
					params: {
						callsign: string;
						eventType: string;
						sceneNumber?: string;
						resourceLineIndex?: string;
					};
			  }
			| {
					type: 'CREATE-SCENE';
					params: CreateSceneMachineInput;
			  }
			| {
					type: 'UPGRADE-ALARMKEYWORD';
					params: { sceneId: number; newKeyword: string };
			  }
			| {
					type: 'ADD-RESOURCE-MANUAL';
					params: { sceneId: number; callsign: string; type: string };
			  };
		context: {
			isSession: boolean;
			resourceActors: ActorRefFrom<typeof resource>[];
			sceneActor: ActorRefFrom<typeof scene>[];
			fetchResult: Prisma.ResourceCreateManyInput[];
			sceneNumber: number;
		};
	},
	actions: {
		createResourceActors: assign({
			resourceActors: ({ spawn }, resources: Prisma.ResourceCreateInput[]) =>
				resources.map((res) => {
					return spawn('resource', {
						systemId: res.callsign,
						id: res.callsign,
						input: {
							resourceType: res.type,
							callsign: res.callsign,
						},
					});
				}),
			fetchResult: (_, resources) => resources,
		}),
		createSceneActor: assign({
			sceneActor: ({ context, spawn }, sceneData: CreateSceneMachineInput) =>
				context.sceneActor.concat(
					spawn('scene', {
						input: {
							address: {
								...sceneData.address,
							},
							alarmKeyword: sceneData.alarmKeyword,
							sceneNumber: context.sceneNumber,
							initialResources: sceneData.initialResources,
						},
						id: `sceneNumber${context.sceneNumber}`,
						systemId: `sceneNumber${context.sceneNumber}`,
					})
				),
			sceneNumber: ({ context }) => context.sceneNumber + 1,
		}),
	},
	actors: {
		scene,
		resource,
		createSessionDb,
		fetchInitialData,
	},
}).createMachine({
	id: 'Notbetrieb Root',
	context: {
		isSession: false,
		resourceActors: [],
		sceneActor: [],
		fetchResult: [],
		sceneNumber: 1,
	},
	initial: 'fetchInitialData',
	states: {
		fetchInitialData: {
			invoke: {
				src: 'fetchInitialData',
				onDone: {
					actions: [
						{
							type: 'createResourceActors',
							params: ({ event }) => event.output,
						},
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
				input: ({ context }) => context.fetchResult,
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
			entry: [assign({ isSession: true, fetchResult: [] })],
			on: {
				'RESOURCE-EVENT': {
					actions: [
						sendTo(
							({ event, system }) => system.get(event.params.callsign),
							({ event }) => {
								return {
									type: event.params.eventType,
									params: { ...event.params },
								};
							}
						),
					],
				},
				'CREATE-SCENE': {
					actions: [
						{
							type: 'createSceneActor',
							params: ({ event }) => {
								return {
									address: {
										...event.params.address,
									},
									alarmKeyword: event.params.alarmKeyword,
									initialResources: event.params.initialResources,
								};
							},
						},
					],
				},
				'UPGRADE-ALARMKEYWORD': {
					//! wie resource event machen, nicht einzelne events für scene und gesammelt für resource
					actions: [
						sendTo(
							({ event, system }) =>
								system.get(`sceneNumber${event.params.sceneId}`),
							({ event }) => {
								return {
									type: 'UPGRADE-ALARMKEYWORD',
									params: { newKeyword: event.params.newKeyword },
								};
							}
						),
					],
				},
				'ADD-RESOURCE-MANUAL': {
					actions: [
						sendTo(
							({ event, system }) =>
								system.get(`sceneNumber${event.params.sceneId}`),
							({ event }) => {
								return {
									type: 'ADD-RESOURCE-MANUAL',
									params: {
										callsign: event.params.callsign,
										type: event.params.type,
									},
								};
							}
						),
					],
				},
			},
		},
	},
});
