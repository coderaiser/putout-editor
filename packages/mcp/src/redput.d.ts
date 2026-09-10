declare module 'redput/compile-rule' {
    export type Rule = Record<string, unknown>;
    
    export function compileRule(code: string, options?: {
        require?: NodeRequire;
    }): Rule;
}
