import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
// import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = "Internal server error";

        if (exception instanceof HttpException) {
            status = exception.getStatus();

            const res = exception.getResponse();
            message =
                typeof res === "string"
                    ? res
                    : (res as any).message || exception.message;
        }

        // Optional: log error
        console.error(exception);

        response.status(status).json({
            message,
            result: null,
        });
    }
}
