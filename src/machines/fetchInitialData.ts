import { assign, createMachine, fromPromise, sendTo } from 'xstate';
import prisma from '../db/prismaClient.js';
import { Prisma } from '@prisma/client';

async function fetchResources() {
	return await prisma.resource.findMany();
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
				target: 'loading',
			},
		},
		loading: {
			invoke: {
				src: fromPromise(() => fetchResources()),
				onDone: {
					target: 'success',
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
						return { type: 'FETCH-ERROR' };
					}
				),
			],
			type: 'final',
		},
		success: { type: 'final' },
		failure: {
			entry: [
				assign({ count: ({ context }) => context.count + 1 }),
				({ context }) => console.log('count erhöht auf', context.count),
			],
			after: {
				1000: 'loading',
			},
		},
	},
});
