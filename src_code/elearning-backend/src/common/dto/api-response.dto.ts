export class ApiResponse<T> {
    message: string;
    result: T;

    constructor(message: string, result: T) {
        this.message = message;
        this.result = result;
    }

    static success<T>(result: T, message = "Success"): ApiResponse<T> {
        return new ApiResponse(message, result);
    }

    static error(message: string): ApiResponse<null> {
        return new ApiResponse(message, null);
    }
}
