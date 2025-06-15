import connectDB from "./src/config/db/index.js";
import dotenv from "dotenv";
import { app } from "./src/app.js";
import { port } from "./src/constants.js";
import logger from "./src/utils/logger.js";
import chalk from "chalk";
import http from "http"
import * as socketIo from "socket.io";

dotenv.config({
	path: "./.env",
});


const server = http.createServer(app)
const io = new socketIo.Server(server, {
	cors: {
		origin: '*',
		methods: ["GET", "POST"],
		credentials: true
	}
}); // Correct way to initialize

const userSocketMap  = {};
const urlColor = chalk.blue.bold;

(async () => {
	try {
		// Connect to the database
		await connectDB();

		// Middleware for Socket connection
		io.on('connection', (socket) => {
			console.log('a user connected');

			// Register the user's socket ID
			socket.on('register', (userId) => {
				userSocketMap[userId] = socket.id;
				console.log(`User registered: ${userId}`);
			});

			socket.on('disconnect', () => {
				// Clean up when a user disconnects
				for (let userId in userSocketMap) {
				if (userSocketMap[userId] === socket.id) {
					delete userSocketMap[userId];
					break;
				}
				}
				console.log('user disconnected');
			});
		});
		// Start the server
		server.listen(port, () => {
			logger.info(
				`Server is running at: ${urlColor(`http://localhost:${port}`)}`
			);
		});
	} catch (error) {
		logger.error("Failed to start the application. Exiting...");
		process.exit(1); // Graceful shutdown on unrecoverable error
	}
})();

// Health check route
app.get("/", (req, res) => {
	res.send("Hello from backend");
});

export { io, userSocketMap, server };
