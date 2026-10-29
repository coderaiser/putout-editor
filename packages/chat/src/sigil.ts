/**
 * The sigil of a command line. Three places strip it: autocomplete, the
 * `exact` check of `Enter`, and `Message`. Keep the rule here.
 */
export const SIGIL = '/';

/**
 * The line with its sigil removed, or unchanged when it has none.
 *
 * Only a **leading** sigil goes, so a body that happens to contain a slash — a
 * pasted `source` line, a URL, a path — is left alone. A line recalled with `↑`
 * and a pasted command both arrive without one and still resolve.
 */
export const prefixOf = (line: string): string => line.startsWith(SIGIL)
    ? line.slice(SIGIL.length)
    : line;

/**
 * Does the line start with the sigil? An empty line returns `false`, but
 * the caller gates on `line && !addressed(line)`: `parseCommand` answers an
 * empty line with `Empty command`.
 */
export const addressed = (line: string): boolean => line.startsWith(SIGIL);
