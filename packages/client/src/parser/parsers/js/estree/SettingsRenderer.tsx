const identity = (v: any) => v;

const isString = (a: unknown): a is string => typeof a === 'string';

interface SettingsConfig {
    title?: string;
    fields: any[];
    required?: Set<string>;
    update?: (settings: any, name: string, value: any) => any;
    values?: (settings: any) => any;
    key?: string;
    settings?: (settings: any) => any;
    [option: string]: any;
}

function valuesFromArray(settings: string[]) {
    return settings.reduce((obj: Record<string, boolean>, name: string) => {
        obj[name] = settings.indexOf(name) > -1;
        return obj;
    }, {});
}

function getValuesFromSettings(settings: any) {
    if (Array.isArray(settings))
        return valuesFromArray(settings);
    
    return settings;
}

const defaultUpdater = (settings: any, name: string, value: any) => ({
    ...settings,
    [name]: value,
});

function arrayUpdater(settings: string[], name: string, value: boolean) {
    const set = new Set(settings);
    
    if (value)
        set.add(name);
    else
        set.delete(name);
    
    return Array.from(set);
}

function getUpdateStrategy(settings: any): (settings: any, name: string, value: any) => any {
    if (Array.isArray(settings))
        return arrayUpdater;
    
    return defaultUpdater;
}

type SettingsRendererProps = {
    settingsConfiguration: SettingsConfig;
    parserSettings: any;
    onChange: (settings: any) => void;
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
                                        checked={values[setting]}
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
                                        value={values[fieldName]}
                                    >
                                        {Array.isArray(options)
                                            ? options.map((o) => (
                                                <option key={o} value={o}>{o}</option>
                                            ))
                                            : Object
                                                .keys(options)
                                                .map((key) => (
                                                    <option key={key} value={options[key]}>{key}</option>
                                                ))}
                                    </select>
                                </label>
                            </li>
                        );
                    }
                    
                    if (setting && typeof setting === 'object')
                        return (
                            <SettingsRenderer
                                key={setting.key}
                                settingsConfiguration={setting}
                                parserSettings={setting.settings(parserSettings)}
                                onChange={(settings) => onChange({
                                    ...parserSettings,
                                    [setting.key]: settings,
                                })}
                            />
                        );
                })}
            </ul>
        </div>
    );
}

