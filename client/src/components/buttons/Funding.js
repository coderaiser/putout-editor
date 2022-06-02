import React from 'react';
import cx from 'classnames';

const fundings = ['patreon', 'opencollective', 'ko-fi'];

class Funding extends React.Component {
    render() {
        return (
            <div className={cx({
                button: true,
                menuButton: true,
            })}>
                <button
                    type="button">
                    <i
                        className={cx({
                            'fa': true,
                            'fa-lg': true,
                            'fa-gratipay': true,
                        })}
                    />
          &nbsp;Funding
                </button>
                {<ul>
                    {fundings.map((funding) => <li
                        key={funding}>
                        <button
                            onClick ={() => window.open(`https://${funding}.com/coderaiser`, '_blank')}
                        >{funding}.com/coderaiser</button>
                    </li>)}
                </ul>}
            </div>
        );
    }
}

export default Funding;
