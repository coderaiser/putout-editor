declare module 'supertape' {
    export function test(name: string, callback: (t: any) => void): void;
    export function stub(): any;
}
