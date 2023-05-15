import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
	const { callsign, event } = req.query;
	console.log(`Callsign: ${callsign}, Event: ${event}`);
	res.send('Ok');
});

export default router;
