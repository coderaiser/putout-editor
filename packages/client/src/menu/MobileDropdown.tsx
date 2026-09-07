import {useState, useEffect, useRef, type ReactNode} from 'react';

type Props = {
    trigger: ReactNode;
    children: ReactNode;
    className?: string;
};

export default function MobileDropdown({trigger, children, className}: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open)
            return;

        // Defer so the tap/click that opened the menu doesn't
        // immediately re-close it via the document listener
        let onPointerDown: ((e: PointerEvent) => void) | null = null;

        const id = setTimeout(() => {
            onPointerDown = (e: PointerEvent) => {
                if (!ref.current?.contains(e.target as Node))
                    setOpen(false);
            };

            document.addEventListener('pointerdown', onPointerDown);
        }, 0);

        return () => {
            clearTimeout(id);

            if (onPointerDown)
                document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [open]);
    
    const classes = ['mobile-dropdown', className]
        .filter(Boolean)
        .join(' ');
    
    return (
        <div ref={ref} className={classes}>
            <button
                type="button"
                className="mobile-dropdown__trigger"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((v) => !v)}
            >
                {trigger}
            </button>
            {open && (
                <ul
                    role="menu"
                    className="mobile-dropdown__menu"
                    onClick={() => setOpen(false)}
                >
                    {children}
                </ul>
            )}
        </div>
    );
}