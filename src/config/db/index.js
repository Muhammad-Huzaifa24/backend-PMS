import mongoose from "mongoose";
import logger from "../../utils/logger.js";

const connectDB = async () => {
	try {
		await mongoose.connect(`${process.env.MONGODB_URI}`);
		console.log("\n");
		logger.info("Database connected successfully");
	} catch (error) {
		logger.error("Database connection failed", error);
		throw error;
	}
};

export default connectDB;
