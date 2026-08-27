import {useSelector} from 'react-redux';
import LoadingIndicator from '../components/LoadingIndicator.js';
import {isLoadingSnippet} from '../store/selectors.js';

export default function LoadingIndicatorContainer() {
    const visible = useSelector(isLoadingSnippet);
    return <LoadingIndicator visible={visible}/>;
}
