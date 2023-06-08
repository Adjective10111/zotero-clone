require('dotenv').config({ path: './.env' });
import mongoose from 'mongoose';
import app from './app';
import * as serverShutter from './utils/serverShutter';

//#region db connection
const db =
	process.env.DATABASE ||
	process.env.DATABASE_LIARA ||
	process.env.DATABASE_LOCAL ||
	'error';

let connectionOptions = {};
if (db === process.env.DATABASE_LIARA)
	connectionOptions = {
		authSource: 'admin'
	};
mongoose
	.connect(db, connectionOptions)
	.then(() => console.log('> DB connection successful!'))
	.catch(err => console.log(err));
//#endregion

// localhost:3000/api/
const port = parseInt(process.env.PORT || '3000', 10);
const server = app.listen(port, () => {
	console.log(`> App running on port ${port}...`);
});

serverShutter.unhandledRejections(server);
serverShutter.sigterm(server);
