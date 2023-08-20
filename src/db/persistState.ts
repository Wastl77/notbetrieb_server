// import { MongoClient } from 'mongodb';
// import { rootActor } from '../app.js';
// import { resourcesRef } from '../machines/resource.js';

// const client = new MongoClient(
// 	`${process.env.DATABASE_URL}/?maxPoolSize=20&w=majority&directConnection=true`
// );

//! When V5 released, persist state only in one machine!

export const persistState = async () => {
	// const documentsToBeInserted = [];
	// const rootActorState = rootActor.getPersistedState();
	// documentsToBeInserted.push({ root: JSON.stringify(rootActorState) });
	// const resArray = [];
	// for (const [key, value] of Object.entries(resourcesRef)) {
	// 	const resourceState = value.getPersistedState();
	// 	resArray.push({ [key]: JSON.stringify(resourceState) });
	// }
	// documentsToBeInserted.push({ resources: resArray });
	// try {
	// 	await client.connect();
	// 	const db = client.db(process.env.SESSION_NAME);
	// 	const collection = db.collection('State');
	// 	const deleteResult = await collection.deleteMany({});
	// 	await collection.insertMany(documentsToBeInserted);
	// 	return deleteResult;
	// } catch (error) {
	// 	console.error('Fehler beim Löschen oder Speichern: ', error);
	// } finally {
	// 	await client.close();
	// }
};

export const getPersistedState = async () => {
	// try {
	// 	await client.connect();
	// 	const state: any = {};
	// 	const db = client.db(process.env.SESSION_NAME);
	// 	const collection = db.collection('State');
	// 	const cursor = collection.find({});
	// 	for await (const doc of cursor) {
	// 		if ('root' in doc) {
	// 			state.root = JSON.parse(doc.root);
	// 		}
	// 		if ('resources' in doc) {
	// 			const resourcesArray = doc.resources.map((res: any) => {
	// 				for (const [key, value] of Object.entries(res)) {
	// 					return { [key]: JSON.parse(value as string) };
	// 				}
	// 			});
	// 			state.resources = resourcesArray;
	// 		}
	// 	}
	// 	return state;
	// } catch (error) {
	// 	console.error('Fehler beim Laden des States: ', error);
	// } finally {
	// 	await client.close();
	// }
};
