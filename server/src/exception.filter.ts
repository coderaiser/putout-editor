import {Response} from 'express';
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';

type UpstreamError = {
    status?: number;
    response?: {
        status: number;
    };
    message?: string;
};

function isUpstreamError(exception: unknown): exception is UpstreamError {
    return typeof exception === 'object' && exception !== null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        
        let status = 500;
        let message = 'Something went wrong';
        
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;
        } else if (isUpstreamError(exception) && exception.response) {
            status = exception.status ?? exception.response.status;
            message = exception.message ?? message;
        } else if (isUpstreamError(exception) && exception.message) {
            message = exception.message;
        }
        
        console.error(new Date().toLocaleString(), exception);
        
        response
            .status(status)
            .json(message);
    }
}
