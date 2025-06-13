import User from "../components/users/model/index.js";
import { serverErrorResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefereshTokens = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = await user.generateAccessToken();
		const refreshToken = await user.generateRefreshToken();

		user.refreshToken = refreshToken;

		await user.save({ validateBeforeSave: false });
		const expiresIn = 3 * 60 * 1000; // 3 minutes in milliseconds

		return { accessToken, refreshToken, expiresIn };
	} catch (error) {
		return serverErrorResponse(res, "Error generating tokens");
	}
};
export { generateAccessAndRefereshTokens };
