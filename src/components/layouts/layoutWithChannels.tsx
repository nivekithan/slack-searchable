import { SlackChannel } from "@prisma/client";
import { useRouter } from "next/router";
import React from "react";
import { ChangeChannelsList, ChangeChannelsOption } from "../changeChannels";

export type LayoutWithChannelsProps = {
  channels: SlackChannel[];
  children: React.ReactNode;
};

export const LayoutWithChannels = ({
  children,
  channels,
}: LayoutWithChannelsProps) => {
  const router = useRouter();
  const { channelId, teamId } = router.query as {
    channelId: string;
    teamId: string;
  };

  return (
    <div className="md:flex min-h-screen">
      <div className="hidden md:block md:w-72 md:border-r md:max-h-screen md:overflow-auto md:px-4">
        <ChangeChannelsList
          channels={channels}
          currentChannelId={channelId}
          teamId={teamId}
        />
      </div>
      <div className="md:mx-8 w-full">{children}</div>
      <div className="absolute bottom-0 w-full border-t p-3 md:hidden">
        <ChangeChannelsOption
          channels={channels}
          currentChannelId={channelId}
          teamId={teamId}
        />
      </div>
    </div>
  );
};
