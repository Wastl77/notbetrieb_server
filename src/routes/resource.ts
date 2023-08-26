import { Router } from 'express';
import { rootActor } from '../app.js';

const router = Router();

router.post('/', (req, res) => {
	const { callsign, event } = req.query;
	if (typeof callsign === 'string' && typeof event === 'string') {
		rootActor.send({
			type: 'RESOURCE-EVENT',
			params: {
				callsign,
				eventType: event,
			},
		});
	}
	res.send('Ok');
});

export default router;
