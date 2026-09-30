export const scan = (root, {crawlFile}) => {
    const files = crawlFile(root, ['package.json']).filter(({filename}) => filename);
    
    return files;
};
