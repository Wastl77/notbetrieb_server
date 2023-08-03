import { PrismaClient } from '@prisma/client';

export let prisma: PrismaClient;

export const startPrisma = () => {
	prisma = new PrismaClient({
		datasources: {
			db: {
				url: `${process.env.DATABASE_URL}/${process.env.SESSION_NAME}?directConnection=true`,
			},
		},
	});
};
