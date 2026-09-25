import {montag} from 'montag';

export default montag`
    // remove-trailing-spaces-from-heading (Markdown plugin)
    
    __putout_processor_markdown([
        heading(2, "Hello World   ")
    ]);
`;
