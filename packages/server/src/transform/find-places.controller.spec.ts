import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {FindPlacesController} from './find-places.controller.ts';
import {FindPlacesService} from './find-places.service.ts';

async function createController(mockService: Record<string, unknown>) {
    const module = await Test.createTestingModule({
        controllers: [FindPlacesController],
        providers: [{provide: FindPlacesService, useValue: mockService}],
    }).compile();
    return module.get(FindPlacesController);
}

test('find-places controller: GET returns documentation', async (t) => {
    const mockService = {documentation: stub().returns({method: 'PUT'}), findPlaces: stub()};
    const controller = await createController(mockService);
    controller.getDocumentation();
    t.calledOnce(mockService.documentation);
    t.end();
});

test('find-places controller: GET documentation has url', async (t) => {
    const mockService = {documentation: stub().returns({url: '/api/v1/find-places'}), findPlaces: stub()};
    const controller = await createController(mockService);
    const result = controller.getDocumentation();
    t.equal(result.url, '/api/v1/find-places');
    t.end();
});

test('find-places controller: PUT calls findPlaces with body', async (t) => {
    const mockService = {documentation: stub(), findPlaces: stub().resolves({places: []})};
    const controller = await createController(mockService);
    const body = {fixture: 'var x = 1;', plugin: ''};
    await controller.findPlaces(body);
    t.calledWith(mockService.findPlaces, [body]);
    t.end();
});

test('find-places controller: PUT returns places result', async (t) => {
    const places = [{rule: 'rule', message: 'use const', position: {line: 1, column: 0}}];
    const mockService = {documentation: stub(), findPlaces: stub().resolves({places})};
    const controller = await createController(mockService);
    const result = await controller.findPlaces({fixture: 'var x = 1;', plugin: ''});
    t.deepEqual(result.places, places);
    t.end();
});