import {montag} from 'montag';

export default montag`
    // convert-maintainer-to-label (Dockerfile plugin)
    
    __putout_processor_docker([
        ["MAINTAINER", "John <john@example.com>"]
    ]);
`;
