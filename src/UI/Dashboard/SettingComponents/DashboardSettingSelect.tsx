import {SelectFieldConfig, SettingsController} from '../../Settings/Controller/SettingsController';
import {ConfigurableSettings} from '../DashboardTypes';
import {memo, useId} from 'react';
import {PostType} from '../../../Types';


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
    const settingConfig = settings.getConfigProfile(settingKey) as SelectFieldConfig;
    const id = useId();
    return (
        <>
            <label htmlFor={id} className={'flex--item s-label fw-normal'}>{textLabel}</label>
            <div className={'flex--item s-select'}>
                <select
                    id={id}
                    value={configurableSettings[settingKey]}
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

export default memo(SettingSelect, (prevProps, nextProps) => {
    return prevProps.textLabel === nextProps.textLabel &&
        prevProps.settingKey === nextProps.settingKey &&
        prevProps.configurableSettings[prevProps.settingKey] === nextProps.configurableSettings[nextProps.settingKey];
});