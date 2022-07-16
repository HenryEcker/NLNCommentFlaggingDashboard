export type ValueType = string | number | boolean;

export interface FieldConfig {
    label: string;
    default?: ValueType;
}

export interface InputFieldConfig extends FieldConfig {
    type: 'number' | 'text' | 'checkbox';
    attributes?: {
        [key: string]: ValueType;
    };
}

export interface SelectFieldConfig extends FieldConfig {
    type: 'select';
    options: string[];
    default: string;
}

export interface SettingConfigFieldType {
    [fieldset: string]: {
        [key: string]: InputFieldConfig | SelectFieldConfig;
    };
}

export interface SettingConfigType {
    id: string;
    title: string;
    fields: SettingConfigFieldType;
}

export interface ConfigVars {
    [key: string]: ValueType;
}

export class SettingsController {
    private readonly config: SettingConfigType;
    private readonly defaultConfigVars: ConfigVars;
    private currentConfigVars: ConfigVars;


    constructor(config: SettingConfigType) {
        this.config = config;
        this.defaultConfigVars = Object.values(config.fields).reduce((acc, o) => {
            Object.entries(o).forEach(([k, v]) => {
                if (v.default !== undefined) {
                    acc[k] = v.default;
                }
            });
            return acc;
        }, {} as ConfigVars);
        this.currentConfigVars = this.load();
    }

    private load(): ConfigVars {
        const c = GM_getValue(this.config.id) as string | undefined;
        if (c) {
            return {...this.defaultConfigVars, ...JSON.parse(c)};
        } else {
            return this.defaultConfigVars;
        }
    }

    reload(): void {
        this.currentConfigVars = this.load();
    }


    save(): void {
        GM_setValue(this.config.id, JSON.stringify(this.currentConfigVars));
    }

    get(key: string): ValueType {
        return this.currentConfigVars[key];
    }

    getConfigProfile(key: string): InputFieldConfig | SelectFieldConfig | undefined {
        let retFieldOptions: InputFieldConfig | SelectFieldConfig | undefined = undefined;
        Object.entries(this.config.fields).forEach(([, fields]) => {
            Object.entries(fields).forEach(([fieldName, fieldOptions]) => {
                if (fieldName === key) {
                    retFieldOptions = fieldOptions;
                }
            });
        });
        return retFieldOptions;
    }

    set(key: string, value: ValueType): void {
        this.currentConfigVars[key] = value;
    }

    setConfigVars(newConfigVars: ConfigVars): void {
        this.currentConfigVars = {...newConfigVars};
    }

    getFullConfigSchema(): SettingConfigType {
        return this.config;
    }

    getActiveConfig(): ConfigVars {
        return this.currentConfigVars;
    }

    getDefaultConfigVars(): ConfigVars {
        return this.defaultConfigVars;
    }

    getTitle(): string {
        return this.config.title;
    }
}