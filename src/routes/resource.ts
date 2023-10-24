import { Router } from 'express';
import { rootActor } from '../app.js';

const router = Router();

router.post('/', (req, res) => {
	const { callsign, event, sceneNumber, resourceLineIndex } = req.query;
	if (
		typeof callsign === 'string' &&
		typeof event === 'string' &&
		(typeof sceneNumber === 'string' || typeof sceneNumber === 'undefined') &&
		(typeof resourceLineIndex === 'string' ||
			typeof resourceLineIndex === 'undefined')
	) {
		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign,
				eventType: event,
				params: {
					sceneNumber,
					resourceLineIndex,
				},
			},
		});
	}
	res.send('Ok');
});

export default router;
