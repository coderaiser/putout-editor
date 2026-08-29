import {useState, useCallback} from 'react';

const baseStyleHorizontal = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    boxSizing: 'border-box',
};

const baseStyleVertical = {
    position: 'absolute',
    left: 0,
    right: 0,
    boxSizing: 'border-box',
};

export default function SplitPane({vertical, className, children, onResize}) {
    const [dividerPosition, setDividerPosition] = useState(50);
    
    const onPointerDown = useCallback(() => {
        const max = vertical ? globalThis.innerHeight : globalThis.innerWidth;
        
        globalThis.document.body.style.cursor = vertical ? 'row-resize' : 'col-resize';
        
        const moveHandler = (event) => {
            event.preventDefault();
            setDividerPosition((vertical ? event.pageY : event.pageX) / max * 100);
        };
        
        const upHandler = () => {
            document.removeEventListener('pointermove', moveHandler);
            document.removeEventListener('pointerup', upHandler);
            globalThis.document.body.style.cursor = '';
            
            if (onResize)
                onResize();
        };
        
        document.addEventListener('pointermove', moveHandler);
        document.addEventListener('pointerup', upHandler);
    }, [vertical, onResize]);
    
    const childArray = Array.isArray(children) ? children.filter(Boolean) : null;
    
    if (!childArray || childArray.length !== 2)
        return (
            <div className={className}>
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    {children}
                </div>
            </div>
        );
    
    let styleA;
    let styleB;
    let dividerStyle;
    
    if (vertical) {
        styleA = {
            ...baseStyleVertical,
            top: 0,
            height: `${dividerPosition}%`,
            paddingBottom: 3,
        };
        styleB = {
            ...baseStyleVertical,
            bottom: 0,
            height: `${100 - dividerPosition}%`,
            paddingTop: 3,
        };
        dividerStyle = {
            ...baseStyleVertical,
            top: `${dividerPosition}%`,
            height: 5,
            marginTop: -2.5,
            zIndex: 100,
        };
    } else {
        styleA = {
            ...baseStyleHorizontal,
            left: 0,
            width: `${dividerPosition}%`,
            paddingRight: 3,
        };
        styleB = {
            ...baseStyleHorizontal,
            right: 0,
            width: `${100 - dividerPosition}%`,
            paddingLeft: 3,
        };
        dividerStyle = {
            ...baseStyleHorizontal,
            left: `${dividerPosition}%`,
            width: 5,
            marginLeft: -2.5,
            zIndex: 100,
        };
    }
    
    return (
        <div className={className}>
            <div style={styleA}>{childArray[0]}</div>
            <div
                className={'splitpane-divider' + (vertical ? ' vertical' : '')}
                onPointerDown={onPointerDown}
                style={dividerStyle}
            />
            <div style={styleB}>{childArray[1]}</div>
        </div>
    );
}
