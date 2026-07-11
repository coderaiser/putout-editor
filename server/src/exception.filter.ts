import {Response} from 'express';
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';

export @Catch()
class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        
        let status = 500;
        let message = 'Something went wrong';
        
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            ({message} = exception);
        } else if (exception.response) {
            status = exception.status || exception.response.status;
            ({message} = exception);
        } else if (exception.message) {
            ({message} = exception);
        }
        
        console.error(new Date().toLocaleString(), exception);
        
        response
            .status(status)
            .json(message);
    }
}
