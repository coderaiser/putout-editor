export const getDocChanges = (oldValue: string, newValue: string) => {
    if (oldValue === newValue)
        return null;
    
    const minLength = Math.min(oldValue.length, newValue.length);
    let start = 0;
    
    while (start < minLength && oldValue[start] === newValue[start])
        start += 1;
    
    let endOld = oldValue.length;
    let endNew = newValue.length;
    
    while (endOld > start && endNew > start && oldValue[endOld - 1] === newValue[endNew - 1]) {
        endOld -= 1;
        endNew -= 1;
    }
    
    return {
        from: start,
        to: endOld,
        insert: newValue.slice(start, endNew),
    };
};
