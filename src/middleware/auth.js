import jwt from "jsonwebtoken";
import User from "../components/users/model/index.js";
import {
	badRequestResponse,
	serverErrorResponse,
	unAuthorizedResponse,
} from "../utils/ApiResponse.js";

export const verifyJWT = async (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			return unAuthorizedResponse(res, undefined);
		}

		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		const user = await User.findById(decodedToken?._id).select("-password");

		if (!user) {
			return badRequestResponse(res, "Invalid access token");
		}

		req.user = user;
		next();
	} catch (error) {
		return unAuthorizedResponse(res, "un Authorized");
	}
};
