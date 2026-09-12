type CompactObjectViewProps = {
    keys: string[];
    onClick?: () => void;
};

export default function CompactObjectView({keys, onClick}: CompactObjectViewProps) {
    if (!keys.length)
        return (
            <span className="p">{'{ }'}</span>
        );
    
    if (keys.length > 5)
        keys = keys
            .slice(0, 5)
            .concat([`... +${keys.length - 5}`]);
    
    return (
        <span>
            <span className="p">{'{'}</span>
            <span className="compact placeholder ge" onClick={onClick}>
                {keys.join(', ')}
            </span>
            <span className="p">{'}'}</span>
        </span>
    );
}
