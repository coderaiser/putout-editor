import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';

const fundings = ['Patreon', 'Opencollective', 'Ko-fi'];

class Fundings extends React.Component {
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
          &nbsp;Fundings
                </button>
                {<ul>
                    {fundings.map((funding) => <li
                        key={funding}>
                        <button
                            onClick ={() => window.open(`https://${funding}.com/coderaiser`, '_blank')}
                        >{funding}</button>
                    </li>)}
                </ul>}
            </div>
        );
    }
}

export default Fundings;
