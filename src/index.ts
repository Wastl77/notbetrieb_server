import express from 'express';
import routes from './routes/index.js';

const app = express();

app.use('/resource', routes.resource);

app.listen(8000, () => {
	console.log('listening on port 8000');
});
