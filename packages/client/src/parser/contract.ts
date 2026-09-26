// The SourceRange primitives live in ../types.ts - the file that documents
// them - and are re-exported here so the existing `./contract.ts` importers
// keep working. Nothing may be added back below that types.ts would then have
// to import, or the pair becomes a cycle again.
import type {ParserSettings} from '../types.ts';

export {
    isCharOffset,
    parseCharOffset,
    parseSourcePosition,
    parseSourceRange,
    type SourceRange,
} from '../types.ts';

type ParserChild = {
    value: unknown;
    key: string;
    computed: boolean;
};

export type ParserWithLoader = {
    nodeToRange: (node: unknown) => unknown;
    forEachProperty: (node: unknown) => Iterable<ParserChild> | void;
    _promise?: Promise<unknown> | null;
    loadParser: (callback: (value: unknown) => void) => void;
    parse: (realParser: unknown, code: string, settings: ParserSettings) => unknown;
    getDefaultOptions: () => ParserSettings;
    opensByDefault?: (node: unknown, key: string) => boolean;
    getNodeName: (node: unknown) => string | null;
    _ignoredProperties: Iterable<unknown> | null;
    locationProps?: Iterable<string> | null;
    typeProps?: Iterable<string> | null;
};

