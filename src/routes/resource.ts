import { Router } from 'express';
import { rootActor } from '../index.js';

const router = Router();

router.post('/', (req, res) => {
	const { callsign, event } = req.query;
	console.log(`Callsign: ${callsign}, Event: ${event}`);
	rootActor.send({ type: 'RESOURCE-EVENT', callsign, eventType: event });
	res.send('Ok');
});

export default router;
