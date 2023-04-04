(async () => {
	(await import('dotenv')).config({path: '../config.env'});
})();
import mongoose from 'mongoose';
import * as serverShutter from './utils/serverShutter';
import app from './app';

//#region db connection
const db = process.env.DATABASE_LOCAL || 'error';

mongoose
	.connect(db)
	.then(() => console.log('> DB connection successful!'));
//#endregion

// localhost:3000/api/
const port = parseInt(process.env.PORT || '3000', 10);
const server = app.listen(port, () => {
	console.log(`> App running on port ${port}...`);
});

serverShutter.unhandledRejections(server);
serverShutter.sigterm(server);
