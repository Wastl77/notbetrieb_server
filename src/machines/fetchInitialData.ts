import {
	AnyEventObject,
	assign,
	createMachine,
	fromPromise,
	sendTo,
} from 'xstate';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prismaClient.js';

const prismaInitialDb = new PrismaClient({
	datasources: {
		db: {
			url: `${process.env.DATABASE_URL}/notbetrieb_test?directConnection=true`,
		},
	},
});

async function fetchResources() {
	return await prismaInitialDb.resource.findMany(); //TODO check, ob client über finally geclosed werden kann
}

async function createSessionDb(input: Prisma.ResourceCreateManyInput[]) {
	return await prisma.resource.createMany({ data: input });
}

export const fetchInitialDataMachine = createMachine({
	types: {} as {
		context: { count: number };
	},
	id: 'fetchMachine',
	context: {
		count: 0,
	},
	initial: 'idle',
	states: {
		idle: {
			always: {
				target: 'fetching',
			},
		},
		fetching: {
			invoke: {
				src: fromPromise(() => fetchResources()),
				onDone: {
					target: 'create_session_db',
					actions: [
						sendTo(
							({ system }) => system.get('Notbetrieb Root'),
							({ event }) => {
								return {
									type: 'FETCH-SUCCESS',
									data: event.output as Prisma.ResourceCreateInput[],
								};
							}
						),
					],
				},
				onError: [
					{
						guard: ({ context }) => context.count > 4, // TODO: inline guards serialisieren als string
						target: 'failed',
						actions: [
							(event) => {
								console.log(event);
							},
						],
					},
					{ target: 'failure' },
				],
			},
		},
		failed: {
			entry: [
				sendTo(
					({ system }) => system.get('Notbetrieb Root'),
					() => {
						return { type: 'INITIALIZATION-ERROR' };
					}
				),
			],
			type: 'final',
		},
		create_session_db: {
			invoke: {
				src: fromPromise(({ input }) => createSessionDb(input.resources)),
				input: ({ event }: AnyEventObject) => ({ resources: event.output }),
				onDone: {
					actions: [
						sendTo(({ system }) => system.get('Notbetrieb Root'), {
							type: 'SESSION-DB-CREATED',
						}),
					],
					target: 'success',
				},
				onError: {
					actions: [
						(event) => {
							console.log(event);
						},
					],
					target: 'failed',
				},
			},
		},
		failure: {
			entry: [
				assign({ count: ({ context }) => context.count + 1 }),
				({ context }) => console.log('count erhöht auf', context.count),
			],
			after: {
				1000: 'fetching',
			},
		},
		success: { type: 'final' },
	},
});
