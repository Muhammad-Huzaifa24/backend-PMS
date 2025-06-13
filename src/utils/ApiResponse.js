class ApiResponse {
	constructor(success, message, data = null) {
		this.success = success;
		this.message = message;
		this.data = data;
	}
}

const successResponse = (res, message = "Success", data = null) => {
	return res.status(200).json(new ApiResponse(true, message, data));
};

const createdResponse = (res, message = "Resource created", data = null) => {
	return res.status(201).json(new ApiResponse(true, message, data));
};

const badRequestResponse = (res, message = "Bad request") => {
	return res.status(400).json(new ApiResponse(false, message));
};

const notFoundResponse = (res, message = "Not found") => {
	return res.status(404).json(new ApiResponse(false, message));
};

const serverErrorResponse = (res, message = "Internal server error") => {
	return res.status(500).json(new ApiResponse(false, message));
};

const unAuthorizedResponse = (res, message = "UnAuthorized") => {
	return res.status(401).json(new ApiResponse(false, message));
};

const alreadyExistResponse = (res, message = "Resource already exist") => {
	return res.status(409).json(new ApiResponse(false, message));
};

export {
	successResponse,
	createdResponse,
	badRequestResponse,
	notFoundResponse,
	unAuthorizedResponse,
	serverErrorResponse,
	alreadyExistResponse,
};
