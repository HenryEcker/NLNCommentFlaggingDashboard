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
    private readonly updatedConfigVars: ConfigVars;
    private readonly SO = {
        'CSS': {
            buttonPrimary: 's-btn s-btn__primary',
            buttonGeneral: 's-btn',
        }
    };


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
        this.updatedConfigVars = {};
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

    private buildSelect(fieldId: string, fieldName: string, fieldOptions: SelectField, val: string): JQuery<HTMLSelectElement> {
        const select: JQuery<HTMLSelectElement> = $(`<select></select>`);
        select.attr('id', fieldId);
        fieldOptions.options.forEach((op) => {
            select.append($(`<option value="${op}">${op}</option>`))
        });
        select.attr('value', val);
        select.on('change', (ev) => {
            this.updatedConfigVars[fieldName] = (ev.target as HTMLSelectElement).value;
        });
        return select;
    }

    private buildInput(fieldId: string, fieldName: string, fieldOptions: NumberField | TextInputField | CheckboxField, val: string): JQuery<HTMLInputElement> {
        const input: JQuery<HTMLInputElement> = $(`<input>`);
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
        } else {
            input.attr('value', val);
        }

        input.on('change', (ev) => {
            const target = ev.target;
            if (target.type === 'checkbox') {
                this.updatedConfigVars[fieldName] = target.checked;
            } else {
                this.updatedConfigVars[fieldName] = target.value;
            }
        });
        return input;
    }

    private buildFieldRow(fieldName: string, fieldOptions: NumberField | TextInputField | CheckboxField | SelectField): JQuery<HTMLElement> {
        const row = $(`<div class="nln-field-row"></div>`)
        const fieldId = `${this.config.id}_${fieldName}`;
        const label = $(`<label id="${fieldId}_label" for="${fieldId}">${fieldOptions.label}</label>`);
        row.append(label);

        const val = this.get(fieldName).toString();
        if (fieldOptions.type === 'select') {
            row.append(this.buildSelect(fieldId, fieldName, fieldOptions, val));
        } else {
            row.append(this.buildInput(fieldId, fieldName, fieldOptions, val));
        }
        return row;
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
                fieldset.append(this.buildFieldRow(fieldName, fieldOptions));
            });
            form.append(fieldset);
        });
        // Form Buttons
        const formButtonWrapper = $(`<div class="nln-config-buttons"></div>`);
        const saveButton = $(`<button class="${this.SO.CSS.buttonPrimary}" type="submit">Save and Reload</button>`);
        const resetButton = $(`<button class="${this.SO.CSS.buttonGeneral}" type="reset">Reset to default</button>`);

        form.on('submit', (ev) => {
            console.log('SUBMIT');
            ev.preventDefault();
            console.log({...this.currentConfigVars, ...this.updatedConfigVars});
            // Do Something to handle save and reload
        });
        form.on('reset', (ev) => {
            console.log('RESET');
            ev.preventDefault();
            // DO something to handle resetting to default
        });

        formButtonWrapper.append(saveButton);
        formButtonWrapper.append(resetButton);
        form.append(formButtonWrapper);
        wrapper.append(form);

        this.mountPoint.append(wrapper);
    }

    open(): void {
        this.buildUI();
    }
}