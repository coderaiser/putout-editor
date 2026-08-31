import PropTypes from 'prop-types';
import {TbLoader2} from 'react-icons/tb';

export default function LoadingIndicator(props) {
    return props.visible ? <div
        className="loadingIndicator cover"
    >
        <div>
            <TbLoader2 size={32}/>
        </div>
    </div> : null;
}

LoadingIndicator.propTypes = {
    visible: PropTypes.bool,
};
