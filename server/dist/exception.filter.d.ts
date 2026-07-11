import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost): Promise<void>;
}
