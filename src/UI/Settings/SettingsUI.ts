import './Settings.scss';

type ValueType = string | number | boolean;

interface FieldConfig {
    label: string;
    default?: ValueType;
}

interface InputFieldConfig extends FieldConfig {
    type: 'number' | 'text' | 'checkbox';
    attributes?: {
        [key: string]: ValueType;
    };
}

interface SelectFieldConfig extends FieldConfig {
    type: 'select';
    options: string[];
    default: string;
}

interface SettingConfigType {
    id: string;
    title: string;
    fields: {
        [fieldset: string]: {
            [key: string]: InputFieldConfig | SelectFieldConfig;
        };
    };
}

interface ConfigVars {
    [key: string]: ValueType;
}

export class SettingsUI {
    private readonly config: SettingConfigType;
    private readonly mountPoint: JQuery<HTMLElement>;
    private readonly defaultConfigVars: ConfigVars;
    private currentConfigVars: ConfigVars;
    private formConfigVars: ConfigVars;
    private readonly SO = {
        'CSS': {
            buttonPrimary: 's-btn s-btn__primary',
            buttonGeneral: 's-btn',
        }
    };
    private readonly boundEscapeHandler: (ev: KeyboardEvent) => void;


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
        this.formConfigVars = {};
        this.boundEscapeHandler = this.escapeKeyHandler.bind(this);
    }

    private load(): ConfigVars {
        const c = GM_getValue(this.config.id) as string | undefined;
        if (c) {
            return JSON.parse(c);
        } else {
            return {};
        }
    }

    reload(): void {
        this.currentConfigVars = this.load();
    }


    save(): void {
        GM_setValue(this.config.id, JSON.stringify(this.currentConfigVars));
    }

    get(key: string): ValueType {
        if (this.currentConfigVars[key] !== undefined) {
            return this.currentConfigVars[key];
        } else {
            return this.defaultConfigVars[key];
        }
    }

    set(key: string, value: ValueType): void {
        this.currentConfigVars[key] = value;
    }


    private buildSelect(fieldId: string, fieldName: string, fieldOptions: SelectFieldConfig, val: ValueType): JQuery<HTMLSelectElement> {
        const select: JQuery<HTMLSelectElement> = $('<select></select>');
        select.attr('id', fieldId);
        fieldOptions.options.forEach((op) => {
            select.append($(`<option value="${op}">${op}</option>`));
        });
        if (val !== undefined) {
            select.val(val.toString());
        }
        select.on('change', (ev) => {
            this.formConfigVars[fieldName] = (ev.target as HTMLSelectElement).value;
        });
        return select;
    }

    private buildInput(fieldId: string, fieldName: string, fieldOptions: InputFieldConfig, val: ValueType): JQuery<HTMLInputElement> {
        const input: JQuery<HTMLInputElement> = $('<input>');
        input.attr('id', fieldId);
        input.attr('type', fieldOptions.type);
        if (fieldOptions.attributes !== undefined) {
            Object.entries(fieldOptions.attributes).forEach(([attributeName, value]) => {
                input.attr(attributeName, value.toString());
            });
        }
        if (val !== undefined) {
            if (fieldOptions.type === 'checkbox' && val === true) {
                input.prop('checked', val);
            } else {
                input.attr('value', val as number | string);
            }
        }

        input.on('change', (ev) => {
            const target = ev.target;
            if (target.type === 'checkbox') {
                this.formConfigVars[fieldName] = target.checked;
            } else {
                this.formConfigVars[fieldName] = target.type === 'number' ? Number(target.value) : target.value;
            }
        });
        return input;
    }

    private buildFieldRow(fieldName: string, fieldOptions: InputFieldConfig | SelectFieldConfig): JQuery<HTMLElement> {
        const row = $('<div class="nln-field-row"></div>');
        const fieldId = `${this.config.id}_${fieldName}`;
        const label = $(`<label id="${fieldId}_label" for="${fieldId}">${fieldOptions.label}</label>`);
        row.append(label);

        const val = this.formConfigVars[fieldName];
        if (fieldOptions.type === 'select') {
            row.append(this.buildSelect(fieldId, fieldName, fieldOptions, val));
        } else {
            row.append(this.buildInput(fieldId, fieldName, fieldOptions, val));
        }
        return row;
    }

    private buildHeaderUI(): JQuery<HTMLElement> {
        const header: JQuery<HTMLElement> = $('<div class="nln-config-header"></div>');
        header.append($(`<span class="nln-header-text">${this.config.title}</span>`));
        const closeButton = $('<button class="nln-config-close-button" title="close this popup (or hit Esc)">×</button>');
        closeButton.on('click', () => {
            this.close();
        });
        header.append(closeButton);
        return header;
    }

    private buildFormUI(): JQuery<HTMLFormElement> {
        const form: JQuery<HTMLFormElement> = $('<form></form>');
        Object.entries(this.config.fields).forEach(([fsName, fields]) => {
            const fieldset = $('<fieldset></fieldset>');
            const legend = $(`<legend>${fsName}</legend>`);
            fieldset.append(legend);
            Object.entries(fields).forEach(([fieldName, fieldOptions]) => {
                fieldset.append(this.buildFieldRow(fieldName, fieldOptions));
            });
            form.append(fieldset);
        });
        // Form Buttons
        const formButtonWrapper = $('<div class="nln-config-buttons"></div>');
        const saveButton = $(`<button class="${this.SO.CSS.buttonPrimary}" type="submit" title="save the current settings and reload the page">Save and Reload</button>`);
        const revertButton = $(`<button class="${this.SO.CSS.buttonGeneral}" type="button" title="revert any changes to the last save point">Revert Changes</button>`);
        const resetButton = $(`<button class="${this.SO.CSS.buttonGeneral}" type="reset" title="reset all values to their defaults">Reset to default</button>`);

        form.on('submit', (ev) => {
            ev.preventDefault();
            // Set current config equal to the form config
            this.currentConfigVars = {...this.formConfigVars};
            // Save currentConfig
            this.save();
            // Reload window so changes take effect
            window.location.reload();
        });

        revertButton.on('click', (ev) => {
            ev.preventDefault();
            // Restore formConfig to default
            this.formConfigVars = {...this.defaultConfigVars, ...this.currentConfigVars};
            // Rebuild UI
            this.buildUI();
        });

        form.on('reset', (ev) => {
            ev.preventDefault();
            // set form config just to default (no current)
            this.formConfigVars = {...this.defaultConfigVars};
            // Rebuild the UI to display the changes
            this.buildUI();
        });

        formButtonWrapper.append(resetButton);
        formButtonWrapper.append(revertButton);
        formButtonWrapper.append(saveButton);
        form.append(formButtonWrapper);
        return form;
    }

    private buildUI(): void {
        this.mountPoint.empty();
        const fullScreenModalContainer = $('<div class="nln-config-modal-background"></div>');
        const modalContainer = $('<div class="nln-config-modal"></div>');

        // Header
        modalContainer.append(this.buildHeaderUI());
        // Form
        modalContainer.append(this.buildFormUI());

        fullScreenModalContainer.append(modalContainer);
        this.mountPoint.append(fullScreenModalContainer);
    }

    private escapeKeyHandler(event: KeyboardEvent): void {
        if (event.defaultPrevented) {
            return; // Should do nothing if the default action has been cancelled
        }
        if (event.key === 'Escape') {
            this.close();
        }
    }


    open(): void {
        // Form
        this.formConfigVars = {...this.defaultConfigVars, ...this.currentConfigVars};
        this.buildUI();
        window.addEventListener('keydown', this.boundEscapeHandler);
    }

    close(): void {
        this.formConfigVars = {}; // empty formConfig when UI is destroyed
        this.mountPoint.empty();
        window.removeEventListener('keydown', this.boundEscapeHandler);
    }
}