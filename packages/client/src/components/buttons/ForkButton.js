import PropTypes from 'prop-types';
import React from 'react';
import {TbGitFork, TbLoader2} from 'react-icons/tb';

export default class ForkButton extends React.Component {
    render() {
        const {
            canFork,
            saving,
            forking,
            onFork,
        } = this.props;
        
        return (
            <button
                type="button"
                disabled={!canFork || saving || forking}
                onClick={onFork}
            >
                {forking ? <TbLoader2 size={18}/> : <TbGitFork size={18}/>} Fork
            </button>
        );
    }
}

ForkButton.propTypes = {
    canFork: PropTypes.bool,
    saving: PropTypes.bool,
    forking: PropTypes.bool,
    onFork: PropTypes.func,
};
