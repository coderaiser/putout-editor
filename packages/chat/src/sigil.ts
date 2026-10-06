/**
 * The sigil a command line starts with.
 *
 * `/` is what separates a command from a sentence, and it is stripped in three
 * places that would otherwise each grow their own copy of the rule: the
 * autocomplete matching a prefix, the `exact` check deciding whether `Enter`
 * completes or sends, and `Message` deciding which answer a line produced. Those
 * are separate components, so the trim lives here rather than in any of them —
 * importing it from `Input` would couple the thread to the composer, and
 * duplicating the one-character slice in each is how the three drift apart.
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
 * Whether a line is addressed to the command registry at all.
 *
 * Purely "does it start with the sigil". An **empty** line is not addressed —
 * there is nothing there to prefix — but that is *not* grounds to reject it:
 * `parseCommand` already answers it with `Empty command`, which is a true
 * statement about it, and treating "no sigil" as "not a command" would replace
 * that with a false one. So the caller gates on `line && !addressed(line)`, and
 * this predicate deliberately does not fold the blank case in.
 */
export const addressed = (line: string): boolean => line.startsWith(SIGIL);
