// The MCP content envelope, in one place. Every tool returned this by hand, and
// the `Error: ${error.message}` form was copy-pasted four times — so a tool that
// wanted a different error prefix had to remember, and nothing said the shape was
// fixed. The `as const` on the discriminant is what makes the return type a tuple
// rather than an array: MCP validates the payload shape at the transport edge.
// A local guard rather than `instanceof Error`, which `types/convert-typeof-to-is-type`
// bans and which also misses a cross-realm Error — and the point of the guard is
// that a thrown value is not always an Error.
type WithMessage = {
    message: string;
};

const hasMessage = (e: unknown): e is WithMessage => e !== null && typeof e === 'object' && 'message' in e;

const messageOf = (e: unknown) => hasMessage(e) ? e.message : String(e);

export type ToolResult = {
    content: [
        {
            type: 'text';
            text: string;
        },
    ];
};

export const text = (value: string): ToolResult => ({
    content: [{
        type: 'text' as const,
        text: value,
    }],
});

export const errorText = (e: unknown): ToolResult => text(`Error: ${messageOf(e)}`);
