import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: `${process.env.DATABASE_URL}/${process.env.SESSION_NAME}?directConnection=true`,
		},
	},
});

export default prisma;
