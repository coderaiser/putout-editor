import {TbDeviceFloppy, TbLoader2} from 'react-icons/tb';

type Props = {
    canSave?: boolean;
    saving?: boolean;
    forking?: boolean;
    onSave?: () => void;
};

export default function SaveButton({canSave, saving, forking, onSave}: Props) {
    return (
        <button
            type="button"
            disabled={!canSave || saving || forking}
            onClick={onSave}
        >
            {saving ? <TbLoader2 size={18}/> : <TbDeviceFloppy size={18}/>} Save
        </button>
    );
}
