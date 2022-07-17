import {SettingsController} from '../../Settings/Controller/SettingsController';
import {PostType} from '../../../Types';
import {ConfigurableSettings} from '../DashboardTypes';
import SettingSlider from './DashboardSettingSlider';
import SettingSelect from './DashboardSettingSelect';
import SettingCheckbox from './DashboardSettingCheckbox';
import {memo} from 'react';


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
                        return {
                            DISPLAY_CERTAINTY: settings.get('DISPLAY_CERTAINTY') as number,
                            MAXIMUM_LENGTH_COMMENT: settings.get('MAXIMUM_LENGTH_COMMENT') as number,
                            POST_TYPE: settings.get('POST_TYPE') as PostType,
                            FILTER_WHITELIST: settings.get('FILTER_WHITELIST') as boolean
                        };
                    });
                    ev.currentTarget.blur();
                }}>
                Reset
            </button>
        </div>
    );
};

export default memo(DashboardSettingsComponent, (prevProps, nextProps) => {
    return (Object.keys(prevProps.configurableSettings) as (keyof ConfigurableSettings)[])
            .reduce((acc, key) => {
                if (prevProps.configurableSettings[key] !== nextProps.configurableSettings[key]) {
                    return false;
                }
                return acc;
            }, false as boolean)
        && prevProps.setConfigurableSettings === nextProps.setConfigurableSettings;
});