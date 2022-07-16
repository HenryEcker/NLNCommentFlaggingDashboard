// noinspection JSUnusedGlobalSymbols

import {Fragment, useCallback, useEffect, useId, useState} from 'react';
import {
    ConfigVars,
    InputFieldConfig,
    SelectFieldConfig,
    SettingConfigFieldType,
    SettingsController,
    ValueType
} from '../Controller/SettingsController';


const SelectField = (
    {id, fieldName, formConfigs, setFormConfigs, fieldOptions}:
        {
            id: string;
            fieldName: string;
            formConfigs: ConfigVars;
            setFormConfigs: React.Dispatch<React.SetStateAction<ConfigVars>>;
            fieldOptions: SelectFieldConfig;
        }
) => {
    return (
        <div className={'grid--item s-select'}>
            <select id={id}
                    value={formConfigs[fieldName].toString()}
                    onChange={ev => {
                        const target: HTMLSelectElement = ev.target;
                        setFormConfigs(oldConfigs => {
                            return {
                                ...oldConfigs,
                                [fieldName]: target.value
                            };
                        });
                    }}
            >
                {fieldOptions.options.map((op) => {
                    return (
                        <option key={op}
                                value={op}>{op}</option>
                    );
                })}
            </select>
        </div>
    );
};


const processHtmlInputTarget = (target: HTMLInputElement): ValueType => {
    if (target.type === 'checkbox') {
        return target.checked;
    } else if (target.type === 'number') {
        return Number(target.value);
    } else {
        return target.value;
    }
};

const InputField = (
    {id, fieldName, formConfigs, setFormConfigs, fieldOptions}:
        {
            id: string;
            fieldName: string;
            formConfigs: ConfigVars;
            setFormConfigs: React.Dispatch<React.SetStateAction<ConfigVars>>;
            fieldOptions: InputFieldConfig;
        }
) => {
    return (

        <input id={id}
               className={`grid--item ${fieldOptions.type === 'checkbox' ? 's-checkbox' : 's-input'}`}
               type={fieldOptions.type}
               {...fieldOptions.attributes}
               {...{
                   [fieldOptions.type === 'checkbox' ? 'checked' : 'value']: formConfigs[fieldName]
               }}
               onChange={ev => {
                   const target = ev.target;
                   setFormConfigs(oldConfigs => {
                       return {
                           ...oldConfigs,
                           [fieldName]: processHtmlInputTarget(target)
                       };
                   });
               }}
        />
    );
};

const Field = (
    {fieldName, formConfigs, setFormConfigs, fieldOptions}:
        {
            fieldName: string;
            formConfigs: ConfigVars;
            setFormConfigs: React.Dispatch<React.SetStateAction<ConfigVars>>;
            fieldOptions: InputFieldConfig | SelectFieldConfig;
        }
) => {
    const id = useId();
    return (
        <Fragment key={fieldOptions.label}>
            <label id={`${id}-label`}
                   htmlFor={id}
                   className={'grid--item s-label'}
            >{fieldOptions.label}</label>
            {
                fieldOptions.type === 'select' ?
                    <SelectField
                        id={id}
                        fieldName={fieldName}
                        formConfigs={formConfigs}
                        setFormConfigs={setFormConfigs}
                        fieldOptions={fieldOptions}
                    />
                    :
                    <InputField
                        id={id}
                        fieldName={fieldName}
                        formConfigs={formConfigs}
                        setFormConfigs={setFormConfigs}
                        fieldOptions={fieldOptions}
                    />
            }
        </Fragment>
    );
};

const FieldSet = (
    {fieldSetName, fields, formConfigs, setFormConfigs}:
        {
            fieldSetName: string;
            fields: SettingConfigFieldType;
            formConfigs: ConfigVars;
            setFormConfigs: React.Dispatch<React.SetStateAction<ConfigVars>>;
        }
) => {
    return (
        <fieldset key={fieldSetName} className={'s-card d-grid grid__auto g12 ai-center'}>
            <legend
                className={'grid--item fs-title lh-sm fc-dark fw-bold td-underline grid--col-all'}
            >
                {fieldSetName}
            </legend>
            {Object.entries(fields)
                .map(([fieldName, fieldOptions]) => {
                    return (
                        <Field
                            key={fieldName}
                            fieldName={fieldName}
                            formConfigs={formConfigs}
                            setFormConfigs={setFormConfigs}
                            fieldOptions={fieldOptions}
                        />
                    );
                })}
        </fieldset>
    );
};

interface SModalEvent extends CustomEvent {
    detail: {
        dispatcher: HTMLElement;
        returnElement: HTMLElement;
    };
}

declare global {
    // Make custom events visible to addEventListener
    interface WindowEventMap {
        's-modal:hide': SModalEvent;
        's-modal:show': SModalEvent;
    }
}

const SettingsUserInterface = ({settings, needsAuth}: { settings: SettingsController; needsAuth: boolean; }) => {
    const modalId = useId();
    const modalTitleId = useId();
    const settingsButtonId = useId();
    const [formConfigs, setFormConfigs] = useState<ConfigVars>(settings.getActiveConfig());

    const handleRevertChanges = useCallback((ev: null | React.MouseEvent<HTMLButtonElement>) => {
        if (ev !== null) {
            ev.preventDefault();
        }
        settings.reload();
        setFormConfigs(settings.getActiveConfig());
    }, [setFormConfigs, settings]);

    useEffect(() => {
        window.addEventListener('s-modal:hide', (ev: SModalEvent): void => {
            // Monitor setting modal being hidden
            if (
                ev.detail.dispatcher &&
                ev.detail.dispatcher.id === modalId // only the settings modal no other modal closure
            ) {
                handleRevertChanges(null);
            }
        });
    }, []);

    return (
        <div data-controller={'s-modal'} className={'w100 h100'}>
            <button
                id={settingsButtonId}
                className={'s-topbar--item s-btn w100 h100'}
                type={'button'}
                data-action={'s-modal#show'}
                title={'NLN Comment Flagging Dashboard Settings'}>
                <svg aria-hidden={'true'}
                     className={'svg-icon iconGear'}
                     width={'20'}
                     height={'18'}
                     viewBox={'0 0 20 18'}>
                    <path
                        d={'m14.53 6.3.28.67C17 7.77 17 7.86 17 8.12V9.8c0 .26 0 .35-2.18 1.22l-.27.66c.98 2.11.91 2.18.73 2.37l-1.3 1.29h-.15c-.2 0-.91-.27-2.14-.8l-.66.27C10.23 17 10.13 17 9.88 17H8.2c-.26 0-.35 0-1.21-2.18l-.67-.27c-1.81.84-2.03.84-2.1.84h-.14l-.12-.1-1.19-1.2c-.18-.18-.24-.25.7-2.4l-.28-.65C1 10.24 1 10.14 1 9.88V8.2c0-.27 0-.35 2.18-1.21l.27-.66c-.98-2.12-.91-2.19-.72-2.39l1.28-1.28h.16c.2 0 .91.28 2.14.8l.66-.27C7.77 1 7.87 1 8.12 1H9.8c.26 0 .34 0 1.2 2.18l.67.28c1.82-.84 2.03-.84 2.1-.84h.14l.12.1 1.2 1.19c.18.18.24.25-.7 2.4Zm-8.4 3.9a3.1 3.1 0 1 0 5.73-2.4 3.1 3.1 0 0 0-5.72 2.4Z'}></path>
                </svg>
            </button>
            <aside className={'s-modal'}
                   data-s-modal-target={'modal'}
                   id={modalId}
                   tabIndex={-1}
                   role={'dialog'}
                   aria-hidden={needsAuth ? 'false' : 'true'}
                   aria-labelledby={modalTitleId}>
                <div className={'s-modal--dialog s-modal__full ws10'}
                     role={'document'}>
                    <h1 className={'s-modal--header'} id={modalTitleId}>{settings.getTitle()}</h1>
                    <form
                        onSubmit={ev => {
                            ev.preventDefault();
                            settings.setConfigVars(formConfigs);
                            settings.save();
                            window.location.reload();
                        }}
                        onReset={ev => {
                            ev.preventDefault();
                            setFormConfigs(settings.getDefaultConfigVars());
                        }}
                    >
                        <div className={'s-modal--body'}>
                            {Object.entries(settings.getFullConfigSchema().fields)
                                .map(([fsName, fields]) => {
                                    return (
                                        <FieldSet key={fsName}
                                                  fieldSetName={fsName}
                                                  fields={fields}
                                                  formConfigs={formConfigs}
                                                  setFormConfigs={setFormConfigs}
                                        />
                                    );
                                })}
                        </div>
                        <div className={'d-flex gs8 gsx jc-end s-modal--footer'}>
                            <button className={'flex--item s-btn s-btn__primary'}
                                    type={'submit'}
                                    title={'save the current settings and reload the page'}>
                                Save and Reload
                            </button>
                            <button className={'flex--item s-btn'}
                                    type={'button'}
                                    title={'revert any changes to the last save point'}
                                    onClick={handleRevertChanges}
                            >
                                Revert Changes
                            </button>
                            <button className={'flex--item s-btn'}
                                    type={'reset'}
                                    title={'reset all values to their defaults'}>
                                Reset to default
                            </button>
                        </div>
                    </form>
                    <button className={'s-modal--close s-btn s-btn__muted'}
                            type={'button'}
                            aria-label={'@_s(" Close")'}
                            data-action={'s-modal#hide'}
                            onClick={handleRevertChanges}>
                        <svg aria-hidden={'true'}
                             className={'svg-icon iconClearSm'}
                             width={'14'}
                             height={'14'}
                             viewBox={'0 0 14 14'}>
                            <path
                                d={'M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z'}></path>
                        </svg>
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default SettingsUserInterface;