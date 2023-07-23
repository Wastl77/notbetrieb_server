import { MongoClient } from 'mongodb';
import { rootActor } from '../index.js';

const client = new MongoClient(
	`${process.env.DATABASE_URL}/?maxPoolSize=20&w=majority&directConnection=true`
);

export const persistState = async () => {
	const state = rootActor.getPersistedState();

	try {
		await client.connect();

		const stateJSON = JSON.stringify(state);
		const stateToPersist = { state: stateJSON };

		const db = client.db(process.env.SESSION_NAME);
		const collection = db.collection('State');

		const deleteResult = await collection.deleteMany({});

		console.log(deleteResult);

		await collection.insertOne(stateToPersist);
	} catch (error) {
		console.error('Fehler beim Löschen oder Speichern: ', error);
	} finally {
		await client.close();
	}
};
