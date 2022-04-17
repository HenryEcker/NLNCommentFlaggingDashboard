import './Settings.scss';

interface Field {
    label: string
}

interface NumberField extends Field {
    type: 'number',
    default?: number,
    min?: number,
    max?: number,
    step?: number,
}

interface TextInputField extends Field {
    type: 'text',
    default?: string,
    minlength?: number,
    maxlength?: number,
    size?: number,
    required?: boolean,
    placeholder?: boolean
}

interface CheckboxField extends Field {
    type: 'checkbox',
    default?: boolean
}

interface SelectField extends Field {
    type: 'select',
    options: Array<string>,
    default: string
}

interface SettingConfigType {
    id: string,
    title: string,
    fields: {
        [fieldset: string]: {
            [key: string]: NumberField | TextInputField | CheckboxField | SelectField
        }
    }
}

interface ConfigVars {
    [key: string]: string | number | boolean
}

export class SettingsUI {
    private readonly config: SettingConfigType;
    private readonly mountPoint: JQuery<HTMLElement>;
    private readonly defaultConfigVars: ConfigVars;
    private readonly currentConfigVars: ConfigVars;

    constructor(mountPoint: JQuery<HTMLElement>, config: SettingConfigType) {
        this.mountPoint = mountPoint;
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
            return JSON.parse(c);
        } else {
            return {}
        }
    }

    private save(): void {
        GM_setValue(this.config.id, JSON.stringify(this.currentConfigVars));
    }

    get(key: string): string | number | boolean {
        return this.currentConfigVars[key] || this.defaultConfigVars[key];
    }

    set(key: string, value: string | number | boolean): void {
        this.currentConfigVars[key] = value;
    }

    private buildUI(): void {
        const wrapper = $(`<div class="nln-config-wrapper"></div>`)
        // Header
        wrapper.append(
            $(`<div class="nln-config-header"><span>${this.config.title}</span></div>`)
        );

        // Form
        const form = $(`<form></form>`);
        Object.entries(this.config.fields).forEach(([fsName, fields]) => {
            const fieldset = $(`<fieldset></fieldset>`);
            const legend = $(`<legend>${fsName}</legend>`);
            fieldset.append(legend);

            Object.entries(fields).forEach(([fieldName, fieldOptions]) => {
                const row = $(`<div class="nln-field-row"></div>`)
                const fieldId = `${this.config.id}_${fieldName}`;
                const label = $(`<label id="${fieldId}_label" for="${fieldId}">${fieldOptions.label}</label>`);
                row.append(label);

                const val = this.get(fieldName).toString();
                if (fieldOptions.type === 'select') {
                    const select = $(`<select></select>`);
                    select.attr('id', fieldId);
                    fieldOptions.options.forEach((op) => {
                        select.append($(`<option value="${op}">${op}</option>`))
                    });
                    select.attr('value', val);
                    row.append(select);
                } else {
                    const input = $(`<input>`);
                    input.attr('id', fieldId);
                    Object.entries(fieldOptions).forEach(([attributeName, value]) => {
                        if (!['label', 'default'].includes(attributeName)) {
                            input.attr(attributeName, value);
                        }
                    });
                    if (fieldOptions.type === 'checkbox') {
                        if (val === 'true') {
                            input.attr('checked', val);
                        }
                    }
                    input.attr('value', val);
                    row.append(input);
                }
                fieldset.append(row);
            });
            form.append(fieldset);
        });
        wrapper.append(form);
        this.mountPoint.append(wrapper);
    }

    open(): void {
        this.buildUI();
    }
}