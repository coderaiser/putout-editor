import {useState} from 'react';

const TABS = [{
    label: 'Transform',
    key: 'transform',
}, {
    label: 'Source',
    key: 'source',
}, {
    label: 'AST',
    key: 'ast',
}, {
    label: 'Code',
    key: 'code',
}];

export default function MobileLayout({topLeft, topRight, bottomLeft, bottomRight}) {
    const [activeKey, setActiveKey] = useState('transform');
    
    const panels = {
        transform: bottomLeft,
        source: topLeft,
        ast: topRight,
        code: bottomRight,
    };
    
    return (
        <div className="mobile-layout">
            <div className="mobile-panel">
                {panels[activeKey]}
            </div>
            <nav className="mobile-tabs" role="tablist">
                {TABS.map(({label, key}) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={activeKey === key}
                        className={activeKey === key ? 'active' : ''}
                        onClick={() => setActiveKey(key)}
                    >
                        {label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
