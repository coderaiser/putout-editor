import {commands} from '@putout/editor-commands';

/**
 * The `help` table, from the registry: one row per command, with `name
 * usage` and the description. A grid of divs, not a `<table>`: `chat.css`
 * sets `grid-template-columns: minmax(140px, max-content) 1fr` and one
 * column under 480px.
 */
export default function HelpBlock() {
    return (
        <div
            className="help-block"
            data-testid="help-block"
        >
            {[...commands.values()].map(({name, usage, description}) => (
                <div
                    className="help-block__row"
                    key={name}
                >
                    <span className="help-block__name">
                        {`/${name} ${usage}`}
                    </span>
                    <span className="help-block__description">
                        {description}
                    </span>
                </div>
            ))}
        </div>
    );
}
