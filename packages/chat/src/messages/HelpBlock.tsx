import {commands} from '@putout/editor-commands';

/**
 * The `/help` table, built from the registry rather than a list written here.
 * The row count is `commands.size` by construction, so a command that is
 * registered but not documented is a command that cannot be — `HelpBlock.spec`
 * pins the count against the map.
 */
export default function HelpBlock() {
    return (
        <table
            className="help-block"
            data-testid="help-block"
        >
            <tbody>
                {[...commands.values()].map(({name, description}) => (
                    <tr
                        className="help-block__row"
                        key={name}
                    >
                        <td className="help-block__name">
                            {`/${name}`}
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
