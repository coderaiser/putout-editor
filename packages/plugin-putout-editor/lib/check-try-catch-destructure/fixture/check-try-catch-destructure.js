import {tryCatch} from 'try-catch';

const knownScripts = (content) => {
    const [error, {scripts = {}} = {}] = tryCatch(JSON.parse, content);
    
    if (error)
        return [];
    
    return Object.keys(scripts);
};

export {knownScripts};
