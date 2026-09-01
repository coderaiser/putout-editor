import './css/tree.css';
import PropTypes from 'prop-types';
import {useDispatch} from 'react-redux';
import React from 'react';
import Element from './tree/Element.js';
import {logEvent} from '../utils/logger.ts';
import {treeAdapterFromParseResult} from './TreeAdapter.js';
import {clearHighlight} from '../store/reducers.ts';

const {useReducer, useMemo} = React;

const STORAGE_KEY = 'tree_settings';

function initSettings() {
    const storedSettings = globalThis.localStorage.getItem(STORAGE_KEY);
    
    return storedSettings ? JSON.parse(storedSettings) : {
        autofocus: true,
        hideFunctions: true,
        hideEmptyKeys: false,
        hideLocationData: false,
        hideTypeKeys: false,
    };
}

function reducer(state, element) {
    const newState = {
        ...state,
        [element.name]: element.checked,
    };
    
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    logEvent('tree_view_settings', element.checked ? 'enabled' : 'disabled', element.name);
    
    return newState;
}

function makeCheckbox(name, settings, updateSettings) {
    return (
        <input
            type="checkbox"
            name={name}
            checked={settings[name]}
            onChange={(event) => updateSettings(event.target)}
        />
    );
}

export default function Tree({focusPath, parseResult}) {
    const [settings, updateSettings] = useReducer(reducer, null, initSettings);
    const treeAdapter = useMemo(() => treeAdapterFromParseResult(parseResult, settings), [parseResult.treeAdapter, settings]);
    const dispatch = useDispatch();
    
    return (
        <div className="tree-visualization container">
            <div className="toolbar">
                <label title="Auto open the node at the cursor in the source code">
                    {makeCheckbox('autofocus', settings, updateSettings)}
                    Autofocus
                </label>
                ​
                {treeAdapter
                    .getConfigurableFilters()
                    .map((filter) => (
                        <span key={filter.key}>
                            <label>
                                {makeCheckbox(filter.key, settings, updateSettings)}
                                {filter.label}
                            </label>
                            ​
                        </span>
                    ))}
            </div>
            <ul
                onMouseLeave={() => {
                    dispatch(clearHighlight());
                }}
            >
                <Element
                    focusPath={focusPath}
                    value={parseResult.ast}
                    level={0}
                    treeAdapter={treeAdapter}
                    settings={settings}
                />
            </ul>
        </div>
    );
}

Tree.propTypes = {
    focusPath: PropTypes.array,
    parseResult: PropTypes.object,
    parser: PropTypes.object,
};
