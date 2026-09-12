type CompactArrayViewProps = {
    array: unknown[] | {
        length: number;
    };
    onClick?: () => void;
};

export default function CompactArrayView({array, onClick}: CompactArrayViewProps) {
    const count = array.length;
    
    if (!count)
        return (
            <span className="p">{'[ ]'}</span>
        );
    
    return (
        <span>
            <span className="p">{'['}</span>
            <span className="compact placeholder ge" onClick={onClick}>
                {count + ' element' + (count > 1 ? 's' : '')}
            </span>
            <span className="p">{']'}</span>
        </span>
    );
}
