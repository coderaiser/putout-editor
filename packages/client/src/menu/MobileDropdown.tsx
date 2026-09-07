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

        const onOutsideClick = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node))
                setOpen(false);
        };

        document.addEventListener('click', onOutsideClick);

        return () => document.removeEventListener('click', onOutsideClick);
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
                onPointerUp={(e) => {
                    e.currentTarget.focus();
                    setOpen((v) => !v);
                }}
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