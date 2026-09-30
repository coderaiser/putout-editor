import {tryCatch} from 'try-catch';

const parsed = (content) => {
    const [error, parsed] = tryCatch(JSON.parse, content);
    
    if (error)
        return null;
    
    return parsed;
};

export {parsed};
