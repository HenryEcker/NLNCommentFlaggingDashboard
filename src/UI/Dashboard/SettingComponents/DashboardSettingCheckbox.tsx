import {ConfigurableSettings} from '../DashboardTypes';
import {memo, useId} from 'react';


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
    const id = useId();
    return (
        <>
            <label htmlFor={id} className={'flex--item s-label fw-normal'}>{textLabel}</label>
            <div className={'flex--item s-toggle-switch'}>
                <input
                    id={id}
                    className={'s-checkbox'}
                    type={'checkbox'}
                    checked={configurableSettings[settingKey]}
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

export default memo(SettingCheckbox, (prevProps, nextProps) => {
    return prevProps.textLabel === nextProps.textLabel &&
        prevProps.settingKey === nextProps.settingKey &&
        prevProps.configurableSettings[prevProps.settingKey] === nextProps.configurableSettings[nextProps.settingKey];
});