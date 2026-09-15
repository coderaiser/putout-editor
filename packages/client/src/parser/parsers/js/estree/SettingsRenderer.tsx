const identity = (value: unknown) => value;

const isString = (a: unknown): a is string => typeof a === 'string';

export type SettingsObject = Record<string, unknown>;

export type SettingsUpdater = (settings: SettingsObject, name: string, value: unknown) => unknown;

export type SettingsFieldValue =
    | string
    | number
    | boolean
    | ((value: unknown) => unknown);

export type SettingsField =
    | string
    | readonly unknown[]
    | SettingsConfig
    | {
        key: string;
        label?: string;
        title?: string;
        values?: (settings: SettingsObject) => string[];
        update?: SettingsUpdater;
        settings?: (settings: SettingsObject) => unknown;
        [option: string]: unknown;
    };

interface SettingsConfig {
    title?: string;
    fields: SettingsField[];
    required?: Set<string>;
    update?: SettingsUpdater;
    values?: (settings: SettingsObject) => SettingsObject;
    key?: string;
    settings?: (settings: SettingsObject) => unknown;
    [option: string]: unknown;
}

function valuesFromArray(settings: string[]) {
    return settings.reduce((obj: Record<string, boolean>, name: string) => {
        obj[name] = settings.indexOf(name) > -1;
        return obj;
    }, {});
}

function getValuesFromSettings(settings: SettingsObject) {
    if (Array.isArray(settings))
        return valuesFromArray(settings);
    
    return settings;
}

const defaultUpdater = (settings: SettingsObject, name: string, value: unknown): SettingsObject => ({
    ...settings,
    [name]: value,
});

function arrayUpdater(settings: SettingsObject, name: string, value: boolean): SettingsObject {
    const set = new Set<string>(settings as unknown as string[]);
    
    if (value)
        set.add(name);
    else
        set.delete(name);
    
    return Array.from(set) as unknown as SettingsObject;
}

function getUpdateStrategy(settings: unknown): SettingsUpdater {
    if (Array.isArray(settings))
        return arrayUpdater as SettingsUpdater;
    
    return defaultUpdater;
}

type SettingsRendererProps = {
    settingsConfiguration: SettingsConfig;
    parserSettings: SettingsObject;
    onChange: (settings: SettingsObject) => void;
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
        update = getUpdateStrategy(parserSettings),
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
                                        onChange={({target}) => onChange(update(parserSettings, setting, target.checked) as SettingsObject)}
                                    />
                                    {setting}
                                </label>
                            </li>
                        );
                    
                    if (Array.isArray(setting)) {
                        const [fieldName, options, converter = identity] = setting as [string, unknown, ((value: unknown) => unknown)?];
                        
                        return (
                            <li key={fieldName}>
                                <label>
                                    {fieldName}:
                                    <select
                                        onChange={({target}) => onChange(update(
                                            parserSettings,
                                            fieldName as string,
                                            converter(target.value),
                                        ) as SettingsObject)}
                                        value={values[fieldName as string] as string}
                                    >
                                        {Array.isArray(options)
                                            ? (options as unknown[]).map((o) => (
                                                <option key={String(o)} value={String(o)}>{String(o)}</option>
                                            ))
                                            : Object
                                                .keys(options as Record<string, unknown>)
                                                .map((key) => (
                                                    <option key={key} value={String((options as Record<string, unknown>)[key])}>{key}</option>
                                                ))}
                                    </select>
                                </label>
                            </li>
                        );
                    }
                    
                    if (setting && typeof setting === 'object') {
                        const nested = setting as SettingsConfig;
                        
                        return (
                            <SettingsRenderer
                                key={nested.key}
                                settingsConfiguration={nested}
                                parserSettings={nested.settings?.(parserSettings) || {} as SettingsObject}
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
