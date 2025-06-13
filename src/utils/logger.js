import {
	format as _format,
	createLogger,
	transports as _transports,
	addColors,
} from "winston";

addColors({
	info: "green",
	warn: "yellow",
	error: "red",
	debug: "blue",
});

const methodColors = {
	GET: "\x1b[32m",
	POST: "\x1b[36m",
	PUT: "\x1b[33m",
	DELETE: "\x1b[31m",
	DEFAULT: "\x1b[37m",
};

// Define log format
const logFormat = _format.combine(
	_format.colorize(),
	_format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	_format.printf(({ timestamp, level, message, method, url }) => {
		const coloredMethod = `${
			methodColors[method] || methodColors.DEFAULT
		}${method}\x1b[0m`;
		const methodInfo = method ? `${coloredMethod}` : "";
		const urlInfo = url ? `${url}` : "";
		return `${timestamp} ${level} ${message} ${methodInfo} ${urlInfo}`;
	})
);

const logger = createLogger({
	level: "info",
	format: logFormat,
	transports: [
		new _transports.Console(),
		new _transports.File({ filename: "logs/app.log" }),
	],
});

export default logger;
