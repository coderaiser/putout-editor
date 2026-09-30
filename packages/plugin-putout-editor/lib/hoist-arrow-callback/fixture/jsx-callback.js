export const List = ({items}) => (
    <ul>{items.map((item) => (
        <li>{item.name}</li>
    ))}</ul>
);

export {List};
