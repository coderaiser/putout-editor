const identity = (value: unknown) => value;

const isString = (a: unknown): a is string => typeof a === 'string';

export type SettingsObject = Record<string, unknown>;

export type Settings = SettingsObject | string[];

export type SettingsUpdater = (settings: Settings, name: string, value: unknown) => Settings;

export type SettingsFieldValue =
    | string
    | number
    | boolean
    | ((value: unknown) => unknown);

export type SettingsField = string | [string, unknown[] | SettingsObject, ((value: unknown) => unknown)?] | SettingsConfig;

export interface SettingsConfig {
    title?: string;
    fields: SettingsField[];
    required?: Set<string>;
    update?: SettingsUpdater;
    values?: (settings: Settings) => SettingsObject;
    key?: string;
    settings?: (settings: Settings) => unknown;
}

function valuesFromArray(settings: string[]) {
    return settings.reduce((obj: Record<string, boolean>, name: string) => {
        obj[name] = settings.indexOf(name) > -1;
        return obj;
    }, {});
}

function getValuesFromSettings(settings: Settings) {
    if (Array.isArray(settings))
        return valuesFromArray(settings);
    
    return settings;
}

function arrayUpdater(settings: string[], name: string, value: unknown): string[] {
    const set = new Set(settings);
    
    if (value)
        set.add(name);
    else
        set.delete(name);
    
    return Array.from(set);
}

const defaultUpdater: SettingsUpdater = (settings, name, value) => {
    if (Array.isArray(settings))
        return arrayUpdater(settings, name, value);
    
    return {
        ...settings,
        [name]: value,
    };
};

type SettingsRendererProps = {
    settingsConfiguration: SettingsConfig;
    parserSettings: Settings;
    onChange: (settings: Settings) => void;
};

export default function SettingsRenderer(props: SettingsRendererProps) {
    const {
        settingsConfiguration,
        parserSettings,
        onChange,
    } = props;
    
    const {
        title,
        fields,
        required = new Set(),
        update = defaultUpdater,
    } = settingsConfiguration;
    
    const values = (settingsConfiguration.values || getValuesFromSettings)(parserSettings);
    
    return (
        <div>
            {title ? <h4>{title}</h4> : null}
            <ul className="settings">
                {fields.map((setting) => {
                    if (isString(setting))
                        return (
                            <li key={setting}>
                                <label>
                                    <input
                                        type="checkbox"
                                        readOnly={required.has(setting)}
                                        disabled={required.has(setting)}
                                        checked={Boolean(values[setting])}
                                        onChange={({target}) => onChange(update(
                                            parserSettings,
                                            setting,
                                            target.checked,
                                        ))}
                                    />
                                    {setting}
                                </label>
                            </li>
                        );
                    
                    if (Array.isArray(setting)) {
                        const [fieldName, options, converter = identity] = setting;
                        
                        return (
                            <li key={fieldName}>
                                <label>
                                    {fieldName}:
                                    <select
                                        onChange={({target}) => onChange(update(
                                            parserSettings,
                                            fieldName,
                                            converter(target.value),
                                        ))}
                                        value={values[fieldName] as string}
                                    >
                                        {Array.isArray(options)
                                            ? options.map((o) => (
                                                <option key={String(o)} value={String(o)}>{String(o)}</option>
                                            ))
                                            : Object
                                                .keys(options)
                                                .map((key) => (
                                                    <option key={key} value={String(options[key])}>{key}</option>
                                                ))}
                                    </select>
                                </label>
                            </li>
                        );
                    }
                    
                    if (setting && typeof setting === 'object') {
                        const nested = setting;
                        
                        // Nested accessors read dynamically named parser options.
                        const settingsResult = nested.settings?.(parserSettings) as Settings | null | undefined;
                        const emptySettings: SettingsObject = Object.create(null);
                        
                        return (
                            <SettingsRenderer
                                key={nested.key}
                                settingsConfiguration={nested}
                                parserSettings={settingsResult || emptySettings}
                                onChange={(settings) => onChange({
                                    ...parserSettings,
                                    [nested.key as string]: settings,
                                })}
                            />
                        );
                    }
                })}
            </ul>
        </div>
    );
}
