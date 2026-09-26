import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Docker: converts MAINTAINER to LABEL', (t) => {
    const {code} = putout(fixtures.Docker, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Docker)],
        ],
    });
    
    const expected = montag`
        // convert-maintainer-to-label (Dockerfile plugin)
        __putout_processor_docker([
            [
                "LABEL",
                "org.opencontainers.image.authors=John <john@example.com>"
            ]
        ]);
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Docker: finds 1 place', (t) => {
    const {places} = putout(fixtures.Docker, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Docker)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
