import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use('/admin', routes.admin);
app.use('/resource', routes.resource);

app.listen(8000, () => {
	console.log('listening on port 8000');
});
