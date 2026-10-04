import {commands} from '@putout/editor-commands';

/**
 * The table `help` renders in the thread, built from the registry rather than
 * a list written here. The row count is `commands.size` by construction, so a
 * command that is registered but not documented is a command that cannot be —
 * `HelpBlock.spec` pins the count against the map.
 *
 * Each row is `name usage` and a description, so `help` teaches what a command
 * *takes* as well as what it does. `usage` comes off the registry, which is the
 * same field `runHelp` prints in the text form: two answers to one question
 * that cannot disagree.
 */
export default function HelpBlock() {
    return (
        <table
            className="help-block"
            data-testid="help-block"
        >
            <tbody>
                {[...commands.values()].map(({name, usage, description}) => (
                    <tr
                        className="help-block__row"
                        key={name}
                    >
                        <td className="help-block__name">
                            {`${name} ${usage}`}
                        </td>
                        <td className="help-block__description">
                            {description}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
