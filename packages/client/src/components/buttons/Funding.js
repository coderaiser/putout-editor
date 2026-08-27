import React from 'react';
import cx from 'classnames';
import {TbHeart} from 'react-icons/tb';

const fundings = [
    'patreon',
    'opencollective',
    'ko-fi',
];

class Funding extends React.Component {
    render() {
        return (
            <div
                className={cx({
                    button: true,
                    menuButton: true,
                })}
            >
                <button
                    type="button"
                >
                    <TbHeart size={18}/>
                    &nbsp;Funding
                </button>
                {<ul>
                    {fundings.map((funding) => (
                        <li
                            key={funding}
                        >
                            <button
                                onClick={() => globalThis.open(`https://${funding}.com/coderaiser`, '_blank')}
                            >{funding}.com/coderaiser</button>
                        </li>
                    ))}
                </ul>}
            </div>
        );
    }
}

export default Funding;
