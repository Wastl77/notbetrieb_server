import { Router } from 'express';
import { rootActor } from '../app.js';
import { SceneInputType } from '../../types.js';

const router = Router();

router.post('/', (req, res) => {
	const sceneInput = req.query.sceneInput as unknown as SceneInputType;
	const sceneInputObject = JSON.parse(sceneInput as unknown as string);
	rootActor.send({
		type: 'CREATE-SCENE',
		params: sceneInputObject,
	});
	res.send('Ok');
});

export default router;
