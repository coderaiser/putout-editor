/**
 * The three action creators the client's `#store` exports and that chat keeps
 * for the same forward-compatible reason: they are no-ops here.
 *
 * `AstTree` is the client's tree component in name only — chat renders
 * `@putout/editor-commands`' own, which manages its selection internally and
 * takes no store at all. These exist so a future edit that reaches for a
 * highlight or a cursor has something to call, and so importing them is a
 * no-change diff. Their presence is a claim about the seam, not a use of it.
 */
export const setHighlight = (): void => {};

export const setCursor = (): void => {};

export const clearHighlight = (): void => {};
