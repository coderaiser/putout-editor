import {Injectable} from '@nestjs/common';
import {TransformService} from '../transform/transform.service.ts';
import {FindPlacesService} from '../transform/find-places.service.ts';
import {ParseService} from '../parse/parse.service.ts';

@Injectable()
export class InfoService {
    constructor(
        private readonly transformService: TransformService,
        private readonly findPlacesService: FindPlacesService,
        private readonly parseService: ParseService,
    ) {}
    
    info() {
        return {
            name: 'putout-editor API',
            description: 'API for parsing JavaScript/TypeScript ASTs and iteratively developing 🐊 Putout plugins via HTTP.',
            workflow: [
                '1. PUT /api/v1/parse — parse your fixture to inspect AST node types',
                '2. PUT /api/v1/parse?query=NodeType — find specific node types and their positions',
                '3. Write a putout plugin using replace, traverse, or include patterns',
                '4. PUT /api/v1/find-places — check what your plugin matches without modifying code',
                '5. Iterate on the plugin until find-places returns expected places',
                '6. PUT /api/v1/transform — apply the plugin and get transformed code',
            ],
            endpoints: {
                parse: this.parseService.documentation(),
                transform: this.transformService.documentation(),
                findPlaces: this.findPlacesService.documentation(),
            },
            errorFormat: {
                description: 'All errors return structured JSON with a kind field for programmatic handling',
                kinds: {
                    plugin_syntax: 'HTTP 400 — plugin is invalid JavaScript. Fix the plugin code. Includes position.line and position.column.',
                    fixture_syntax: 'HTTP 422 — fixture is invalid JavaScript. Fix the fixture.',
                    plugin_error: 'HTTP 422 — plugin compiled but failed at runtime. Fix plugin logic.',
                },
                example: {
                    kind: 'plugin_syntax',
                    message: 'Unexpected token (1:13)',
                    position: {line: 1, column: 13},
                },
            },
            links: {
                putoutDocs: 'https://github.com/coderaiser/putout/blob/master/README.md',
                pluginDevelopment: 'https://github.com/coderaiser/putout/blob/master/docs/plugin-development.md',
                putoutScript: 'https://github.com/coderaiser/putout/blob/master/docs/putout-script.md',
                compare: 'https://github.com/coderaiser/putout/tree/master/packages/compare#readme',
                engineRunner: 'https://github.com/coderaiser/putout/tree/master/packages/engine-runner#readme',
                babelASTExplorer: 'https://astexplorer.net/#/gist/3a1dedd0e264db65ea46b59cf1f66d6d/latest',
            },
        };
    }
}