import {InputFieldConfig, SelectFieldConfig, SettingsController} from '../Settings/Controller/SettingsController';
import {PostType} from '../../Types';
import {useEffect, useId, useState} from 'react';
import {ConfigurableSettings} from './DashboardTypes';


const SettingSlider = (
    {
        settings, configurableSettings, setConfigurableSettings,
        settingKey, textLabel, formatSliderValue
    }: {
        settings: SettingsController;
        configurableSettings: ConfigurableSettings;
        setConfigurableSettings: React.Dispatch<React.SetStateAction<ConfigurableSettings>>;
        settingKey: 'DISPLAY_CERTAINTY' | 'MAXIMUM_LENGTH_COMMENT';
        textLabel: string;
        formatSliderValue: (v: string | number) => string;
    }
): JSX.Element => {
    const settingConfig = settings.getConfigProfile(settingKey) as InputFieldConfig;
    const id = useId();

    const [value, setValue] = useState<number>(configurableSettings[settingKey]);

    useEffect(() => {
        setValue(configurableSettings[settingKey]);
    }, [configurableSettings[settingKey]]);

    return (
        <>
            <label htmlFor={id} className={'flex--item s-label fw-normal'}>
                {textLabel}
            </label>
            <input id={id}
                   type={'range'}
                   min={settingConfig.attributes?.min as number | undefined}
                   max={settingConfig.attributes?.max as number | undefined}
                   step={settingConfig.attributes?.step as number | undefined}
                   value={value}
                   className={'flex--item slider'}
                   onChange={ev => {
                       setValue(() => {
                           return Number((ev.target as HTMLInputElement).value);
                       });
                   }}
                   onMouseUp={ev => {
                       setConfigurableSettings(oldConfigurableSettings => {
                           return {
                               ...oldConfigurableSettings,
                               [settingKey]: Number((ev.target as HTMLInputElement).value)
                           };
                       });
                   }}
            />
            <span>{formatSliderValue(value)}</span>
        </>
    );
};

const SettingSelect = (
    {
        settings, configurableSettings, setConfigurableSettings,
        settingKey, textLabel
    }: {
        settings: SettingsController;
        configurableSettings: ConfigurableSettings;
        setConfigurableSettings: React.Dispatch<React.SetStateAction<ConfigurableSettings>>;
        settingKey: 'POST_TYPE';
        textLabel: string;
    }
): JSX.Element => {
    const value = configurableSettings[settingKey];
    const settingConfig = settings.getConfigProfile(settingKey) as SelectFieldConfig;
    const id = useId();
    return (
        <>
            <label htmlFor={id} className={'flex--item s-label fw-normal'}>{textLabel}</label>
            <div className={'flex--item s-select'}>
                <select
                    id={id}
                    value={value}
                    onChange={ev => {
                        setConfigurableSettings(oldConfigurableSettings => {
                            return {
                                ...oldConfigurableSettings,
                                [settingKey]: (ev.target as HTMLSelectElement).value as PostType
                            };
                        });
                    }}
                >
                    {
                        settingConfig.options.map((op) => {
                            return (
                                <option value={op} key={op}>{op}</option>
                            );
                        })
                    }
                </select>
            </div>
        </>
    );
};

const SettingCheckbox = (
    {
        configurableSettings,
        setConfigurableSettings,
        settingKey,
        textLabel
    }: {
        configurableSettings: ConfigurableSettings;
        setConfigurableSettings: React.Dispatch<React.SetStateAction<ConfigurableSettings>>;
        settingKey: 'FILTER_WHITELIST';
        textLabel: string;
    }
): JSX.Element => {
    const value = configurableSettings[settingKey];
    const id = useId();
    return (
        <>
            <label htmlFor={id} className={'flex--item s-label fw-normal'}>{textLabel}</label>
            <div className={'flex--item s-toggle-switch'}>
                <input
                    id={id}
                    className={'s-checkbox'}
                    type={'checkbox'}
                    checked={value}
                    onChange={ev => {
                        setConfigurableSettings(oldConfigurableSettings => {
                            return {
                                ...oldConfigurableSettings,
                                [settingKey]: Boolean((ev.target as HTMLInputElement).checked)
                            };
                        });
                    }}
                />
                <div className={'s-toggle-switch--indicator'}/>
            </div>
        </>
    );
};


const SettingElemContainer = ({children}: React.PropsWithChildren) => {
    return (
        <div className={'d-flex gs8 ai-center'}>
            {children}
        </div>
    );
};

const DashboardSettingsComponent = ({settings, configurableSettings, setConfigurableSettings}: {
    settings: SettingsController;
    configurableSettings: ConfigurableSettings;
    setConfigurableSettings: React.Dispatch<React.SetStateAction<ConfigurableSettings>>;
}): JSX.Element => {

    return (
        <div className={'d-flex gs8 flex__center fd-row fd-wrap'}>
            <SettingElemContainer>
                <SettingSlider settings={settings}
                               configurableSettings={configurableSettings}
                               setConfigurableSettings={setConfigurableSettings}
                               settingKey={'DISPLAY_CERTAINTY'}
                               textLabel={'Display Certainty'}
                               formatSliderValue={(v) => `${Number(v).toFixed(2)}%`}
                />
            </SettingElemContainer>
            <SettingElemContainer>
                <SettingSlider settings={settings}
                               configurableSettings={configurableSettings}
                               setConfigurableSettings={setConfigurableSettings}
                               settingKey={'MAXIMUM_LENGTH_COMMENT'}
                               textLabel={'Maximum Length'}
                               formatSliderValue={(v) => `${Number(v).toFixed(0)}`}
                />
            </SettingElemContainer>
            <SettingElemContainer>
                <SettingSelect settings={settings}
                               configurableSettings={configurableSettings}
                               setConfigurableSettings={setConfigurableSettings}
                               settingKey={'POST_TYPE'}
                               textLabel={'Post Type'}
                />
            </SettingElemContainer>
            <SettingElemContainer>
                <SettingCheckbox configurableSettings={configurableSettings}
                                 setConfigurableSettings={setConfigurableSettings}
                                 settingKey={'FILTER_WHITELIST'}
                                 textLabel={'Filter Whitelist'}
                />
            </SettingElemContainer>
            <button
                className={'s-btn ml-auto flex--item'}
                onClick={ev => {
                    ev.preventDefault();
                    setConfigurableSettings(() => {
                        const c = {
                            DISPLAY_CERTAINTY: settings.get('DISPLAY_CERTAINTY') as number,
                            MAXIMUM_LENGTH_COMMENT: settings.get('MAXIMUM_LENGTH_COMMENT') as number,
                            POST_TYPE: settings.get('POST_TYPE') as PostType,
                            FILTER_WHITELIST: settings.get('FILTER_WHITELIST') as boolean
                        };
                        console.log(c);
                        return c;
                    });
                    ev.currentTarget.blur();
                }}>
                Reset
            </button>
        </div>
    );
};

export default DashboardSettingsComponent;