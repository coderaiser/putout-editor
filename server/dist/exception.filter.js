var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException, } from '@nestjs/common';
let GlobalExceptionFilter = class GlobalExceptionFilter {
    async catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = 500;
        let message = 'Something went wrong';
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;
        }
        else if (exception.response) {
            status = exception.status || exception.response.status;
            message = exception.message;
        }
        else if (exception.message) {
            message = exception.message;
        }
        console.error(new Date().toLocaleString(), exception);
        response
            .status(status)
            .json(message);
    }
};
GlobalExceptionFilter = __decorate([
    Catch()
], GlobalExceptionFilter);
export { GlobalExceptionFilter };
