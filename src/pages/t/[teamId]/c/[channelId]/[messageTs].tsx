import { SlackChannel } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ChangeChannelsOption } from "../../../../../components/changeChannels";
import { LayoutWithChannels } from "../../../../../components/layouts/layoutWithChannels";
import { Thread } from "../../../../../components/thread";
import {
  getAllChannelsInTeam,
  getAMessageWithRepliesAndUser,
} from "../../../../../server/slack";
import type { MessageWithUserAndReplies } from "../../../../../types";

type ServerSideProps = {
  thread: MessageWithUserAndReplies;
  channels: SlackChannel[];
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context
) => {
  const { teamId, channelId, messageTs } = context.query;

  if (
    typeof teamId !== "string" ||
    typeof channelId !== "string" ||
    typeof messageTs !== "string"
  ) {
    throw new Error("Invalid params");
  }

  const [messageWithReplies, channelsInTeam] = await Promise.all([
    getAMessageWithRepliesAndUser({
      channelId,
      teamId,
      messageTs,
    }),
    getAllChannelsInTeam({ teamId }),
  ]);

  if (messageWithReplies === null) {
    return { notFound: true };
  }

  return {
    props: { thread: messageWithReplies, channels: channelsInTeam },
  };
};

const RenderThread: NextPage<ServerSideProps> = ({ thread, channels }) => {
  return (
    <LayoutWithChannels channels={channels}>
      <div className="flex flex-col gap-y-4">
        <div>
          <h3 className="text-md font-bold">Thread</h3>
          <div className="border-b-2 mt-2"></div>
        </div>
        <Thread thread={thread} />
      </div>
    </LayoutWithChannels>
  );
};

export default RenderThread;
