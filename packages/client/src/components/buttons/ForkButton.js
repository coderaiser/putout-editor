import {TbGitFork, TbLoader2} from 'react-icons/tb';

export default function ForkButton({canFork, saving, forking, onFork}) {
    return (
        <button
            type="button"
            disabled={!canFork || saving || forking}
            onClick={onFork}
        >
            {forking ? <TbLoader2 size={18}/> : <TbGitFork size={18}/>} Fork
        </button>
    );
}
