import { Settings } from "@prisma/client";

export type SettingsListProps = {
  teamId: string;
  currentSettings: Settings;
};

export const SettingsList = ({
  currentSettings,
  teamId,
}: SettingsListProps) => {
  const isMaskUserName = currentSettings.maskSlackUserName;

  return (
    <form>
      <div>
        <label htmlFor="mask-username-settings">
          Hide username of message authors
        </label>
        <input
          type="radio"
          id="mask-username-settings"
          defaultChecked={isMaskUserName}
        />
      </div>
    </form>
  );
};
