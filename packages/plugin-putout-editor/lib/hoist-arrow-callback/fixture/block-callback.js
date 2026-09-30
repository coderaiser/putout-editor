const isFile = (file) => file.type === 'file';

export const scan = (root, {trackFile}) => {
    const files = trackFile(root, '*.js').filter((file) => {
        return isFile(file);
    });
    
    return files;
};
