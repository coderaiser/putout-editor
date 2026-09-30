export const files = crawlFile(root, ['package.json']).filter(({filename}) => filename);
