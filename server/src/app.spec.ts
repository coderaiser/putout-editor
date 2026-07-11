import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {AppModule} from './app.module.ts';

test('application module: can compile', async (t) => {
    const module = await Test
        .createTestingModule({
            imports: [AppModule],
        })
        .compile();
    
    const app = module.createNestApplication();
    
    await app.init();
    t.ok(app);
    
    await app.close();
    t.end();
});
