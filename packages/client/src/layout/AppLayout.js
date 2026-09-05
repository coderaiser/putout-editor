import {SplitPane} from '#ui';

export default function AppLayout({topLeft, topRight, bottomLeft, bottomRight}) {
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
