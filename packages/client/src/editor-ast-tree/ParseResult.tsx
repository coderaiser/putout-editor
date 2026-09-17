/**
 * Describes the result of a parse process. Only exists here for documentation
 * purposes. The field names mirror the real `ParseResult` type from
 * `../store/reducers.ts` — keep them in sync.
 */
export const ParseResult = {
    /**
   * The generated AST
   */
    ast: 'AstNode',
    /**
   * An error object, if parsing resulted in an error
   */
    error: 'Object',
    /**
   * How long it took to generate the AST
   */
    time: 'number',
    
    treeAdapter: {
        /**
     * The type of the adapter to use, as defined in TreeAdapters.js
     */
        type: 'string',
        /**
     * Override the default options with these values
     */
        options: 'Object',
    },
};
