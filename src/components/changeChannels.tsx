import { SlackChannel } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";

export type ChangeChannelsProps = {
  channels: SlackChannel[];
  teamId: string;
  currentChannelId: string;
};
export const ChangeChannels = ({
  channels,
  teamId,
  currentChannelId,
}: ChangeChannelsProps) => {
  const router = useRouter();

  const onChoosingDifferentChannel = async (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedChannelId = e.currentTarget.value;
    const newUrlHref = `/t/[teamId]/c/[channelId]`;
    const newUrl = `/t/${teamId}/c/${selectedChannelId}`;

    await router.replace(newUrlHref, newUrl);
  };

  return (
    <form className="flex flex-col border-t px-3 py-2 gap-y-2">
      <label htmlFor="choose-slack-channel" className="font-bold">
        Choose channel
      </label>
      <select
        id="choose-slack-channel"
        defaultValue={currentChannelId}
        className="py-2 border rounded-md px-2"
        onChange={onChoosingDifferentChannel}
      >
        {channels.map((channel) => {
          return (
            <option key={channel.id} value={channel.slackChannelId}>
              {channel.slackChannelName}
            </option>
          );
        })}
      </select>
    </form>
  );
};
