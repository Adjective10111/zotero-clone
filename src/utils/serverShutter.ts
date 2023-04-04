import { type Server } from 'http';

const logError = (error: Error): void =>
	console.error(`${error.name}: ${error.message}\n${error.stack}`);

process.on('uncaughtException', err => {
	console.log('> UNCAUGHT EXCEPTION!');
	logError(err);
	console.log('> Shutting down...');
	process.exit(1);
});

export const unhandledRejections = (server: Server): NodeJS.Process =>
	process.on('unhandledRejection', (err: Error) => {
		console.log('> UNHANDLED REJECTION!');
		logError(err);
		console.log('> Shutting down...');
		server.close(() => {
			process.exit(1);
		});
	});

export const sigterm = (server: Server): NodeJS.Process =>
	process.on('SIGTERM', () => {
		console.log('> SIGTERM RECEIVED!\n> Shutting down...');
		server.close(() => {
			console.log('\t> Process terminated!');
		});
	});
