import { SlackChannel } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ChangeChannelsOption } from "../../../../../components/changeChannels";
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
  const router = useRouter();
  const { teamId, channelId } = router.query as {
    teamId: string;
    channelId: string;
  };

  return (
    <div>
      <div className="mx-3">
        <Thread thread={thread} />
      </div>
      <div className="absolute bottom-0 w-full">
        <div className="mx-3">
          <ChangeChannelsOption
            channels={channels}
            currentChannelId={channelId}
            teamId={teamId}
          />
        </div>
      </div>
    </div>
  );
};

export default RenderThread;
