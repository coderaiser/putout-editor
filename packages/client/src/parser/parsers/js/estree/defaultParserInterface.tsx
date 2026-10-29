import SettingsRenderer, {type SettingsConfig, type Settings} from './SettingsRenderer.tsx';
import type {AstNode} from '../../../../types.ts';

/**
 * The minimal interface that every parser must implement. This object provides
 * default values/implementations. Methods/properties that must be provided
 * by the parser are mentioned in comments.
 */
export default {
    /**
   * A parser provides `id` (stored in snippets: never change it),
   * `displayName`, `version`, `homepage`, `loadParser` and `parse`.
   * `showInMenu`: show this parser in the UI.
   */
    showInMenu: true,
    /**
   * Used by `forEachProperty` to skip properties.
   */
    _ignoredProperties: new Set(),
    /**
   * Those properties of an AST node (object) that provide location information
   * so that they can be hidden in the UI if the option is selected.
   */
    locationProps: new Set(),
    /**
   * Those properties of an AST node (object) that provide node name
   * so that they can be hidden in the UI if the option is selected.
   */
    typeProps: new Set(['type']), /**
   * Whether or not the provided node should be automatically expanded.
   */opensByDefault() {
        return false;
    },
    
    /**
   * The start and end indices of the node in the source text. The return value
   * is an array of form `[start, end]`. This is used for highlighting source
   * text and focusing nodes in the tree.
   */nodeToRange(node: AstNode) {
        return node.range;
    },
    
    /**
   * A more or less human readable name of the node.
   */getNodeName(node: AstNode) {
        return node.type;
    },
    
    /**
   * A generator to iterate over each "property" of the node. Overwriting this
   * function allows a parser to expose information from a node if the node
   * is not implemented as plain JavaScript object.
   */*forEachProperty(node: AstNode) {
        for (const prop in node) {
            if (this._ignoredProperties.has(prop))
                continue;
            
            yield {
                value: node[prop],
                key: prop,
                computed: false,
            };
        }
    },
    
    /**
   * The settings UI for the default options: `{title?, fields, required?,
   * update?, key?}`. A field is a name (checkbox), `[name, values, mapper?]`
   * (select), or a nested settings object.
   */_getSettingsConfiguration(defaultOptions: Record<string, unknown>): SettingsConfig | null {
        const keys = Object.keys(defaultOptions);
        
        return keys.length > 0 ? {
            fields: keys,
        } : null;
    },
    
    hasSettings() {
        return this._getSettingsConfiguration(this.getDefaultOptions()) != null;
    },
    
    /**
   * A complete settings object passed to the parser that defines the default
   * value for each option.
   */getDefaultOptions() {
        return {};
    },
    
    /**
   * Defines how to merge default options into current options. While this may
   * not seem necessary, we don't know which version of the options are stored
   * in a snippet or the client browser, so this function is called to ensure
   * that all options are set.
   */_mergeDefaultOptions(currentOptions: Settings, defaultOptions: Record<string, unknown>) {
        return {
            ...defaultOptions,
            ...currentOptions,
        };
    },
    
    /**
   * This method is called when the settingds UI is rendered. It is passed the
   * current parser settings and a callback that should be called with the
   * updated settings object.
   */renderSettings(settings: Settings | null, onChange: (settings: Settings) => void) {
        const defaultOptions = this.getDefaultOptions();
        const settingsConfiguration = this._getSettingsConfiguration(defaultOptions);
        
        if (!settingsConfiguration)
            return null;
        
        settings = settings == null ? defaultOptions : this._mergeDefaultOptions(settings, defaultOptions);
        
        return (
            <SettingsRenderer
                settingsConfiguration={settingsConfiguration}
                parserSettings={settings}
                onChange={onChange}
            />
        );
    },
};
