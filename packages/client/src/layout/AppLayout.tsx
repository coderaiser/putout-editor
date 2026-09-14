import type {ReactNode} from 'react';
import {SplitPane} from '#ui';

interface AppLayoutProps {
    topLeft: ReactNode;
    topRight: ReactNode;
    bottomLeft: ReactNode;
    bottomRight: ReactNode;
}

export default function AppLayout({topLeft, topRight, bottomLeft, bottomRight}: AppLayoutProps) {
    return (
        <SplitPane className="splitpane-content" vertical={true}>
            <SplitPane className="splitpane">
                {topLeft}
                {topRight}
            </SplitPane>
            <SplitPane className="splitpane">
                {bottomLeft}
                {bottomRight}
            </SplitPane>
        </SplitPane>
    );
}
