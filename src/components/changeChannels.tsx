import { SlackChannel } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";

export type ChangeChannelsProps = {
  channels: SlackChannel[];
  teamId: string;
  currentChannelId: string;
};
export const ChangeChannelsOption = ({
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
    <form className="flex flex-col gap-y-2">
      <label htmlFor="choose-slack-channel" className="font-bold">
        Choose Channel
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

export const ChangeChannelsList = ({
  channels,
  currentChannelId,
  teamId,
}: ChangeChannelsProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <h3 className="font-bold text-md">Choose Channel</h3>
        <div className="border-b-2 mt-2"></div>
      </div>
      {channels.map((channel) => {
        const channelHref = `/t/${teamId}/c/${channel.slackChannelId}`;
        const isChannelActive = currentChannelId === channel.slackChannelId;

        const channelActiveStyle = isChannelActive
          ? "text-blue-500 font-semibold"
          : "";

        return (
          <Link href={channelHref}>
            <a
              className={`hover:text-blue-500 hover:underline flex gap-x-2 ${channelActiveStyle}`}
            >
              <span>#</span>
              {channel.slackChannelName}
            </a>
          </Link>
        );
      })}
    </div>
  );
};
