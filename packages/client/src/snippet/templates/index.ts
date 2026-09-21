import replacer from './replacer.ts';
import traverser from './traverser.ts';
import includer from './includer.ts';
import fixer from './fixer.ts';
import checker from './checker.ts';
import watcher from './watcher.ts';
import lister from './lister.ts';
import ignorer from './ignorer.ts';
import declarer from './declarer.ts';
import equaler from './equaler.ts';
import deleter from './deleter.ts';
import duplicater from './duplicater.ts';
import counter from './counter.ts';
import typer from './typer.ts';
import finder from './finder.ts';

export {
    replacer,
    traverser,
    includer,
    fixer,
    checker,
    watcher,
    lister,
    ignorer,
    declarer,
    equaler,
    deleter,
    duplicater,
    counter,
    typer,
    finder,
};

export const categories = [
    'Replacer',
    'Traverser',
    'Includer',
    'Fixer',
    'Checker',
    'Watcher',
    'Lister',
    'Ignorer',
    'Decaler',
    'EqualsTo',
    'Deleter',
    'Duplicater',
    'Counter',
    'Typer',
    'Finder',
] as const;

export type SnippetCategory = typeof categories[number];

export const templates: Record<SnippetCategory, string> = {
    Replacer: replacer,
    Traverser: traverser,
    Includer: includer,
    Fixer: fixer,
    Checker: checker,
    Watcher: watcher,
    Lister: lister,
    Ignorer: ignorer,
    Decaler: declarer,
    EqualsTo: equaler,
    Deleter: deleter,
    Duplicater: duplicater,
    Counter: counter,
    Typer: typer,
    Finder: finder,
};
