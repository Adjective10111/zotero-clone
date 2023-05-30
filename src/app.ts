import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import apiRouter from './routes/apiRouter';
import Controller from './utils/Controller';
import { createError } from './utils/errorFactory';
import errorHandler from './utils/errorHandler';

const app = express();
const whitelist: string[] = [];

/* security middlewares */
app
	.use(helmet())
	.use(mongoSanitize())
	.use(
		cors({
			origin: function (origin, callback) {
				if (whitelist.length === 0 || whitelist.includes(origin || 'error'))
					callback(null, true);
				else callback(createError(401, 'unrecognizable origin'));
			},
			methods: ['GET', 'POST', 'PATCH', 'DELETE'],
			credentials: true
		})
	)
	.use(
		'/api',
		rateLimit({
			max: 100,
			windowMs: 60 * 60 * 1000,
			message: 'Too many requests'
		})
	);

/* request and response modifiers */
app
	.use(express.json({ limit: '10kb' }))
	.use(express.urlencoded({ extended: true, limit: '10kb' }))
	.use(cookieParser())
	.use(compression());

/* open-access folder for files */
app.use(express.static(`${__dirname}/public`));

/* add dev middlewares */
if (process.env.NODE_ENV === 'dev') {
	app.use(morgan('dev'));
}

app.use('/api', apiRouter).all('*', Controller.unavailable).use(errorHandler);

export default app;
