import process from 'node:process';
import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {
    AppModule,
    getStaticModules,
} from './app.module.ts';

test('application module: can compile', async (t) => {
    const module = await Test
        .createTestingModule({
            imports: [AppModule],
        })
        .compile();
    
    const app = module.createNestApplication();
    
    await app.init();
    
    await app.close();
    
    t.ok(app);
    t.end();
});

test('application module: getStaticModules returns empty when STATIC unset', (t) => {
    const prev = process.env.STATIC;
    
    delete process.env.STATIC;
    
    const result = getStaticModules();
    
    t.equal(result.length, 0);
    t.end();
    
    if (prev)
        process.env.STATIC = prev;
});

test('application module: getStaticModules returns modules when STATIC set', (t) => {
    const prev = process.env.STATIC;
    
    process.env.STATIC = '/tmp';
    
    const result = getStaticModules();
    
    t.equal(result.length, 1);
    t.end();
    
    if (prev) {
        process.env.STATIC = prev;
        return;
    }
    
    delete process.env.STATIC;
});
