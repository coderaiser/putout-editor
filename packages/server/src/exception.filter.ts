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

function sendError(response: Response, status: number, message: string) {
    console.error(new Date().toLocaleString());
    
    response
        .status(status)
        .json(message);
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            
            sendError(response, status, exception.message);
            return;
        }
        
        if (!isUpstreamError(exception)) {
            sendError(response, 500, 'Something went wrong');
            return;
        }
        
        if (exception.response) {
            const status = exception.status || exception.response.status;
            
            sendError(response, status, exception.message || 'Something went wrong');
            return;
        }
        
        if (exception.message) {
            sendError(response, 500, exception.message);
            return;
        }
        
        sendError(response, 500, 'Something went wrong');
    }
}
