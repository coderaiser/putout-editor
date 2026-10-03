import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import type {Place} from '@putout/editor-commands';
import PlacesList from './PlacesList.tsx';

const place = (over: Partial<Place> = {}): Place => ({
    message: 'use const',
    rule: 'variables',
    position: {
        line: 2,
        column: 8,
    },
    ...over,
});

const places = (data: Place[]) => render(
    <PlacesList
        data={data}
    />,
);

test('PlacesList: shows the line:col of each match', (t) => {
    places([
        place(),
    ]);
    
    const element = document.querySelector('.places-list__position');
    const result = element && element.textContent;
    const expected = '2:8';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('PlacesList: shows the message of each match', (t) => {
    places([
        place(),
    ]);
    
    const element = document.querySelector('.places-list__message');
    const result = element && element.textContent;
    const expected = 'use const';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('PlacesList: renders one item per match', (t) => {
    places([
        place(),
        place({
            position: {
                line: 5,
                column: 0,
            },
        }),
    ]);
    
    const result = document.querySelectorAll('.places-list__item').length;
    const expected = 2;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('PlacesList: falls back to the rule name when there is no message', (t) => {
    places([
        place({
            message: undefined,
        }),
    ]);
    
    const element = document.querySelector('.places-list__message');
    const result = element && element.textContent;
    const expected = 'variables';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('PlacesList: a match with neither message nor rule shows nothing', (t) => {
    places([
        place({
            message: undefined,
            rule: undefined,
        }),
    ]);
    
    const element = document.querySelector('.places-list__message');
    const result = element && element.textContent;
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('PlacesList: a match with no position shows a dash', (t) => {
    places([
        place({
            position: undefined,
        }),
    ]);
    
    const element = document.querySelector('.places-list__position');
    const result = element && element.textContent;
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('PlacesList: no matches says so rather than showing an empty list', (t) => {
    places([]);
    
    const element = document.querySelector('[data-testid="places-list"]');
    const result = element && element.textContent;
    const expected = 'No matches';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
