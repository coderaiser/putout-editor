import process from 'node:process';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {GlobalExceptionFilter} from './exception.filter.js';

const app = await NestFactory.create(AppModule);

app.enableCors();
app.useGlobalFilters(new GlobalExceptionFilter());

const {PORT = 8080} = process.env;

await app.listen(PORT, '0.0.0.0');

