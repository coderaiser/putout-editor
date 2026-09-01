import cx from 'classnames';

export const Button = ({selectedOutput, setSelectedOutput}) => (name, index) => (
    <button
        key={index}
        value={index}
        onClick={(event) => setSelectedOutput(event.target.value)}
        className={cx({
            active: selectedOutput === index,
        })}
    >
        {name}
    </button>
);
