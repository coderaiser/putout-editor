import {Module} from '@nestjs/common';
import {TransformController} from './transform.controller.ts';
import {TransformService} from './transform.service.ts';

@Module({
    controllers: [TransformController],
    providers: [TransformService],
})
export class TransformModule {}
