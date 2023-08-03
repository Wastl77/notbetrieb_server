import { MongoClient } from 'mongodb';

const client = new MongoClient(
	`${process.env.DATABASE_URL}/?maxPoolSize=1&w=majority&directConnection=true`
);

export const getSessions = async () => {
	try {
		await client.connect();

		const db = client.db('admin');

		const response = await db.admin().listDatabases();

		const transformResponse = () => {
			const databasesArray = response.databases;
			const databases: { [key: string]: string } = {};
			let counter = 1;

			const regex = /^[0-9,-]+$/;

			databasesArray.forEach((item) => {
				if (typeof item.name === 'string' && regex.test(item.name)) {
					const key = `database${counter}`;
					databases[key] = item.name;
					counter++;
				}
			});

			return JSON.stringify(databases);
		};
		const databases = transformResponse();

		return databases;
	} catch (error) {
		console.error('Fehler beim Abrufen der Datenbanken: ', error);
	} finally {
		await client.close();
	}
};
