import { PrismaClient } from '@prisma/client';

const sessionName = new Date().toLocaleString('de-DE').replace(/[:.\s]/g, '-');

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: `${process.env.DATABASE_URL}/${sessionName}?directConnection=true`,
		},
	},
});

export default prisma;
