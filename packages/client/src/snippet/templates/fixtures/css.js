import {montag} from 'montag';

export default montag`
    // remove-vendor-prefix (CSS plugin)
    
    __putout_processor_css([
        declaration("-webkit-user-select", "none"),
        declaration("user-select", "none"),
    ]);
`;
