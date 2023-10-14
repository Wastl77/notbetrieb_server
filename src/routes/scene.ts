import { Router } from 'express';
import { rootActor } from '../app.js';
import { generateInitialResources } from '../util/generateInitialResources.js';
import { CreateSceneInput } from '../../types.js';

const router = Router(); //TODO all routes mit body statt query?

router.post('/', (req, res) => {
	const sceneInput = req.query.sceneInput as unknown as CreateSceneInput;
	const sceneInputObject = JSON.parse(sceneInput as unknown as string);
	const initialResources = generateInitialResources(
		sceneInputObject.alarmKeyword
	);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: { ...sceneInputObject, initialResources }, //!als nächstes alarm keyword resolver
	});
	res.send('Ok');
});

// dev function start
router.get('/', (req, res) => {
	const snapshot = rootActor.getSnapshot();
	Object.keys(snapshot.children).forEach((child) => {
		console.log(snapshot.children[child].getSnapshot().context);
	});
	res.send('Ok');
});
// dev function end

export default router;
