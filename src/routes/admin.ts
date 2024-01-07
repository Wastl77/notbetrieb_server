import { Router, Request, Response } from 'express';
import { initializeApp } from '../app.js';
import { persistState } from '../db/persistState.js';
import { getSessions } from '../db/getSessions.js';

type SessionName = { sessionName?: string | undefined };

const router = Router();

router.get(
	'/start-session',
	(req: Request<unknown, unknown, unknown, SessionName>, res: Response) => {
		console.log('Starting App');
		const { sessionName } = req.query;
		initializeApp(sessionName);
		res.send('App started');
	}
);

router.post('/test-persist', async (req: Request, res: Response) => {
	const persistedState = await persistState();
	res.send(persistedState);
});

router.get('/get-sessions', async (req: Request, res: Response) => {
	const dbList = await getSessions();
	res.send(dbList);
});

router.get('/get-actual-session', async (req: Request, res: Response) => {
	const actualSession = process.env.SESSION_NAME;
	res.send(actualSession);
});

export default router;
