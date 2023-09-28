import { Router } from 'express';
import { rootActor } from '../app.js';
import { CreateSceneInput } from '../../types.js';

const router = Router(); //TODO all routes mit body statt query?

router.post('/', (req, res) => {
	const sceneInput = req.query.sceneInput as unknown as CreateSceneInput;
	const sceneInputObject = JSON.parse(sceneInput as unknown as string);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: { ...sceneInputObject, initialResources: ['rtw', 'nef'] },
	});
	res.send('Ok');
});

export default router;
