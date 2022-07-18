import {InputFieldConfig, SettingsController} from '../../Settings/Controller/SettingsController';
import {ConfigurableSettings} from '../DashboardTypes';
import {memo, useEffect, useId, useState} from 'react';


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
    }, [setValue, configurableSettings[settingKey]]);

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

export default memo(SettingSlider, (prevProps, nextProps) => {
    return prevProps.textLabel === nextProps.textLabel &&
        prevProps.formatSliderValue === nextProps.formatSliderValue &&
        prevProps.settingKey === nextProps.settingKey &&
        prevProps.configurableSettings[prevProps.settingKey] === nextProps.configurableSettings[nextProps.settingKey];
});