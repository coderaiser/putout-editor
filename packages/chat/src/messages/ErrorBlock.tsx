export interface ErrorBlockProps {
    message: string;
}

/** The one block that is red, and the only reason `.error-block` exists. */
export default function ErrorBlock({message}: ErrorBlockProps) {
    return (
        <div
            className="error-block"
            data-testid="error-block"
        >
            {message}
        </div>
    );
}
