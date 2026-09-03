import {Module} from '@nestjs/common';
import {LlmsController} from './llms.controller.ts';
import {LlmsService} from './llms.service.ts';

@Module({
    controllers: [LlmsController],
    providers: [LlmsService],
})
export class LlmsModule {}