import {useState} from 'react';
import cx from 'classnames';
import {
    TbDeviceFloppy,
    TbFileCode,
    TbGitFork,
    TbLoader2,
} from 'react-icons/tb';
import ForkButton from './ForkButton.tsx';
import NewButton from '../../components/buttons/NewButton.tsx';
import SaveButton from './SaveButton.tsx';
import ShareButton from './ShareButton.js';

export default function SnippetButton(props) {
    const [forceClosed, setForceClosed] = useState(false);
    const {
        canFork,
        canSave,
        saving,
        forking,
        onFork,
        onSave,
    } = props;
    
    const canForkAndNotSave = canFork && !canSave;
    const savingOrForking = saving || forking;
    
    const onTriggerClick = () => {
        setForceClosed(true);
    };
    
    const onItemClick = () => {
        setForceClosed(true);
    };
    
    const onMouseLeave = () => {
        setForceClosed(false);
    };
    
    return (
        <div
            className={cx({
                'button': true,
                'menuButton': true,
                'is-closed': forceClosed,
            })}
            onMouseLeave={onMouseLeave}
        >
            <span onClick={onTriggerClick}>
                <TbFileCode size={18}/>
                Snippet
            </span>
            <ul onClick={onItemClick}>
                <li><NewButton {...props}/></li>
                <li><SaveButton {...props}/></li>
                <li><ForkButton {...props}/></li>
                <li><ShareButton {...props}/></li>
            </ul>
            <button
                type="button"
                title={canForkAndNotSave ? 'Fork' : 'Save'}
                style={{
                    minWidth: 0,
                }}
                disabled={savingOrForking || !canSave && !canFork}
                onClick={canForkAndNotSave ? onFork : onSave}
            >
                {savingOrForking ? <TbLoader2 size={18}/> : canForkAndNotSave ? <TbGitFork size={18}/> : <TbDeviceFloppy size={18}/>}
            </button>
        </div>
    );
}
