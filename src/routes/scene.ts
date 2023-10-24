import { Router } from 'express';
import { rootActor } from '../app.js';
import { generateResources } from '../util/generateResources.js';
import { CreateSceneInput } from '../../types.js';

const router = Router(); //TODO all routes mit body statt query?

router.post('/', (req, res) => {
	const sceneInput = req.query.sceneInput as unknown as CreateSceneInput;
	const sceneInputObject = JSON.parse(sceneInput as unknown as string);
	const initialResources = generateResources(sceneInputObject.alarmKeyword);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: { ...sceneInputObject, initialResources },
	});
	res.send('Ok');
});

router.post('/:sceneId', (req, res) => {
	// '/:sceneID/UPGRADE-ALARMKEYWORD'
	//! so umschreiben, dass bei nachalarm auch adresse geupdatat werden kann
	console.log(req.params.sceneId);
	const newKeyword = req.query.newKeyword as unknown as string;
	const sceneId = +req.params.sceneId;
	rootActor.send({
		type: 'UPGRADE-ALARMKEYWORD',
		params: { sceneId, newKeyword },
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
