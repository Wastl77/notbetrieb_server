import { MongoClient } from 'mongodb';
import { rootActor } from '../app.js';

const client = new MongoClient(
	`${process.env.DATABASE_URL}/?maxPoolSize=20&w=majority&directConnection=true`
);

export const persistState = async () => {
	const rootActorState = rootActor.getPersistedSnapshot();
	const rootActorStateStringified = { root: JSON.stringify(rootActorState) };
	try {
		await client.connect();
		const db = client.db(process.env.SESSION_NAME);
		const collection = db.collection('State');
		const deleteResult = await collection.deleteMany({});
		await collection.insertOne(rootActorStateStringified);
		return deleteResult;
	} catch (error) {
		console.error('Fehler beim Löschen oder Speichern: ', error);
	} finally {
		await client.close();
	}
};

export const getPersistedState = async () => {
	try {
		await client.connect();
		let state: any = {};
		const db = client.db(process.env.SESSION_NAME);
		const collection = db.collection('State');
		const cursor = collection.find({});
		for await (const doc of cursor) {
			if ('root' in doc) {
				state = JSON.parse(doc.root);
			}
		}
		return state;
	} catch (error) {
		console.error('Fehler beim Laden des States: ', error);
	} finally {
		await client.close();
	}
};
