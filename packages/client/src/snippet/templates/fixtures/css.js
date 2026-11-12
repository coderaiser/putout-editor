import {montag} from 'montag';

export default montag`
    __putout_processor_css([
        rule(selector([
            classSelector("hello"),
        ]), [
            declaration("box-shadow", valueList([
                0,
                dimension(-4, "px"),
                dimension(16, "px"),
                functionValue("rgb", [
                    0,
                    0,
                    0,
                    percentage(20),
                ]),
            ])),
        ]),
    ]);
`;
