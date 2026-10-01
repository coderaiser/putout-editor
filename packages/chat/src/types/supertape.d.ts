// A side-effect import of a stylesheet: rspack turns it into a chunk, and
// `tsc` needs to be told the specifier is not a module. Same one-liner the
// client keeps in `src/types/supertape.d.ts`.
declare module '*.css'
