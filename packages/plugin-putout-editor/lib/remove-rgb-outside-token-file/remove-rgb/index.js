const {fromEntries} = Object;

const PATTERNS = [
    'functionValue("rgb", __a)',
    'functionValue("rgba", __a)',
    'color(__a)',
];

const entries = (a) => fromEntries(PATTERNS.map((b) => [b, a(b)]));

export const report = () => 'colours belong in tokens.css, reach for a var() instead';

export const match = () => entries(() => () => true);

export const replace = () => entries((a) => a);
