import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {AppModule} from './app.module.js';
import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';

test('application module: can compile', async (t) => {
    const module = await Test
        .createTestingModule({
            imports: [AppModule],
        })
        .compile();
    
    const app = module.createNestApplication();
    
    await app.init();
    
    const controller = app.get(AppController);
    const service = app.get(AppService);
    
    t.ok(controller && service);
    
    await app.close();
    t.end();
});
