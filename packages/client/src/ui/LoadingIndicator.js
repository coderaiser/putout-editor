import {useSelector} from 'react-redux';
import {TbLoader2} from 'react-icons/tb';
import {isLoadingSnippet} from '../store/selectors.ts';

export default function LoadingIndicator() {
    const visible = useSelector(isLoadingSnippet);
    
    return visible
        ? <div
            className="loadingIndicator cover"
        >
            <div>
                <TbLoader2 size={32}/>
            </div>
        </div>
        : null;
}
