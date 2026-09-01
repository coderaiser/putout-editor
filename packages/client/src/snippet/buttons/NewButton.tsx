import {TbFilePlus} from 'react-icons/tb';

type Props = {
    saving?: boolean;
    forking?: boolean;
    onNew?: () => void;
};

export default function NewButton({saving, forking, onNew}: Props) {
    return (
        <button
            type="button"
            disabled={saving || forking}
            onClick={onNew}
        >
            <TbFilePlus size={18}/> New
        </button>
    );
}
