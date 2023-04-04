import path from 'path';
import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import compression from 'compression';
//import xss from 'xss-clean';

import errorHandler from './utils/errorHandler';
//import apiRouter from './routes/apiRoutes';
//import { unavailable } from './utils/handlerFactory';

const app = express();

// security middlewares
//app.use(xss());
app.use(helmet())
	.use(mongoSanitize())
	.use(
		'/api',
		rateLimit({
			max: 100,
			windowMs: 60 * 60 * 1000,
			message: 'Too many requests from this IP, please try again in an hour!'
		})
	);

// request and response modifiers
app.use(express.json({limit: '10kb'}))
	.use(express.urlencoded({extended: true, limit: '10kb'}))
	.use(cookieParser())
	.use(compression());

// open-access folder for files
app.use(express.static(path.join(__dirname, 'public')));

// add dev middlewares
if (process.env.NODE_ENV === 'dev') {
	app.use(morgan('dev'));
}
app
//app.use('/api', apiRouter)
//	.use('*', unavailable)
	.use(errorHandler);

export default app;