import cx from 'classnames';

type ButtonProps = {
    selectedOutput: number;
    setSelectedOutput: (index: number) => void;
};

export const Button = ({selectedOutput, setSelectedOutput}: ButtonProps) => (name: React.ReactNode, index: number) => (
    <button
        key={index}
        value={index}
        onClick={() => setSelectedOutput(index)}
        className={cx({
            active: selectedOutput === index,
        })}
    >
        {name}
    </button>
);
