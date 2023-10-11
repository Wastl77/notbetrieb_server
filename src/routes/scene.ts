import { Router } from 'express';
import { rootActor } from '../app.js';
import { CreateSceneInput } from '../../types.js';

const router = Router(); //TODO all routes mit body statt query?

router.post('/', (req, res) => {
	const sceneInput = req.query.sceneInput as unknown as CreateSceneInput;
	const sceneInputObject = JSON.parse(sceneInput as unknown as string);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: { ...sceneInputObject, initialResources: ['rtw', 'nef'] }, //!als nächstes alarm keyword resolver
	});
	res.send('Ok');
});

// dev function start
router.get('/', () => {
	const snapshot = rootActor.getSnapshot();
	Object.keys(snapshot.children).forEach((child) => {
		console.log(snapshot.children[child].getSnapshot().context);
	});
});
// dev function end

export default router;
