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

router.post('/:sceneId/UPGRADE-ALARMKEYWORD', (req, res) => {
	// '/:sceneID/UPGRADE-ALARMKEYWORD'
	//! so umschreiben, dass bei nachalarm auch adresse geupdatat werden kann
	const newKeyword = req.query.newKeyword as unknown as string;
	const sceneId = +req.params.sceneId;
	rootActor.send({
		type: 'UPGRADE-ALARMKEYWORD',
		params: { sceneId, newKeyword },
	});
	res.send('Ok');
});

router.post('/:sceneId/ADD-RESOURCE-MANUAL', (req, res) => {
	const callsign = req.query.callsign as unknown as string;
	const type = req.query.type as unknown as string;
	const sceneId = +req.params.sceneId;
	rootActor.send({
		type: 'ADD-RESOURCE-MANUAL',
		params: { sceneId, callsign, type },
	});
	res.send('Ok');
});

// dev function start
router.get('/', (req, res) => {
	const snapshot = rootActor.getSnapshot();
	Object.keys(snapshot.children).forEach((child) => {
		console.log(snapshot.children[child].getSnapshot().context); //! hier den state loggen und gucken ob in R2(Qt) gegangen wird
	});
	console.log(snapshot.children['sceneNumber1'].getSnapshot().value);
	res.send('Ok');
});
// dev function end

export default router;
