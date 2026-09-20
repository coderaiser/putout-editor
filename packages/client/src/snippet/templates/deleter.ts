import {montag} from 'montag';

export default montag`
    // putout-rule-apply-headers-trim

    export const report = () => 'Trim trailing heading 🧹';

    export const fix = ({headerText}) => headerText.replace(/ +$/, '');

    export const traverse = ({push, listStore}) => ({
        'h1,h2,h3,h4'(path) {
            const {textContent} = path.node;

            if (/ +$/.test(textContent)) {
                push({
                    path,
                    message: 'Trim heading',
                });
            }
        },
    });
`;
