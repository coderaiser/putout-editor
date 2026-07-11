import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import {Response} from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    async catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        
        let status = 500;
        let message = 'Something went wrong';
        
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;
        } else if (exception.response) {
            status = exception.status || exception.response.status;
            message = exception.message;
        } else if (exception.message) {
            message = exception.message;
        }
        
        console.error(new Date().toLocaleString(), exception);
        
        response
            .status(status)
            .json(message);
    }
}
