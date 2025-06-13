import logger from "../utils/logger.js";

const logRequestMiddleware = (req, _, next) => {
	const formattedUrl = req.originalUrl.replace(/^\/api/, "");
	logger.info(``, { method: req.method, url: formattedUrl });
	next();
};

export { logRequestMiddleware };
