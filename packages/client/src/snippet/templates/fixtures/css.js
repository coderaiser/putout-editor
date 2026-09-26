import {montag} from 'montag';

export default montag`
    // convert-rgb-to-var (CSS plugin)
    // The CSS processor wraps declarations as function calls, so a literal color
    // shows up as functionValue("rgb", ...).
    
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
