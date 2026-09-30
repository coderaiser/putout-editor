const isFile = (file) => file.type === 'file';

export const scan = (root, {trackFile}) => {
    const files = trackFile(root, '*.js').filter(isFile);
    
    return files;
};
