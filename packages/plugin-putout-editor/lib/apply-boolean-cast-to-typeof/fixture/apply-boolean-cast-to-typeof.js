const isObject = (value) => Boolean(value) && typeof value === 'object';
const isNode = (value) => Boolean(value) && typeof value === 'object';
const mismatched = (value) => Boolean(value) && typeof other === 'object';
const notBoolean = (value) => value && typeof value === 'object';
const unrelated = (value) => Boolean(value) && value === 'object';
const otherType = (value) => Boolean(value) && typeof value === 'string';

export {
    isObject,
    isNode,
    mismatched,
    notBoolean,
    unrelated,
    otherType,
};
