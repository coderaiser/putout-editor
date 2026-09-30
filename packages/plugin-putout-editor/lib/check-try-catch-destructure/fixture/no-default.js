import {tryCatch} from 'try-catch';

const ast = (content) => {
    const [error, {type}] = tryCatch(JSON.parse, content);
    
    if (error)
        return null;
    
    return type;
};

export {ast};
