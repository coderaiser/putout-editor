import type {Place} from '@putout/editor-commands';

export interface PlacesListProps {
    data: Place[];
}

/** `line:col` is 1-based for the line, as the tree's gutter and the status bar are. */
const positionOf = ({position}: Place): string => {
    if (!position)
        return '—';
    
    return `${position.line}:${position.column}`;
};

/** A match's own line, falling back to the rule name when there is no message. */
const describe = ({message, rule}: Place): string => message || rule || '';

export default function PlacesList({data}: PlacesListProps) {
    if (!data.length)
        return (
            <div
                className="places-list places-list--empty"
                data-testid="places-list"
            >
                {'No matches'}
            </div>
        );
    
    return (
        <ol
            className="places-list"
            data-testid="places-list"
        >
            {data.map((place, index) => (
                <li
                    className="places-list__item" // The place carries no id of its own, and the list is a
                    // report of positions: the index is the identity here.
                    
                    key={`${positionOf(place)}-${index}`}
                >
                    <code className="places-list__position">
                        {positionOf(place)}
                    </code>
                    <span className="places-list__message">
                        {describe(place)}
                    </span>
                </li>
            ))}
        </ol>
    );
}
