import {commands} from '@putout/editor-commands';

/**
 * The list `help` renders in the thread, built from the registry rather than
 * a list written here. The row count is `commands.size` by construction, so a
 * command that is registered but not documented is a command that cannot be —
 * `HelpBlock.spec` pins the count against the map.
 *
 * Each row is `name usage` and a description, so `help` teaches what a command
 * *takes* as well as what it does. `usage` comes off the registry, which is the
 * same field `runHelp` prints in the text form: two answers to one question
 * that cannot disagree.
 *
 * A **grid of divs**, not a `<table>`. A table's `td` takes the full row and
 * its columns collapse to content on a phone, so the name and description ran
 * together and `help` read as prose. `chat.css` lays the row out as
 * `grid-template-columns: minmax(140px, max-content) 1fr` — name pinned,
 * description taking the rest — and stacks to one column under 480px. The class
 * names are the ones the spec and the CSS already read, so the change is the
 * element, not the contract.
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
