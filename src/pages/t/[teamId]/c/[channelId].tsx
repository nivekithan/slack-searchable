import { Message, SlackChannel } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ChangeChannels } from "../../../../components/changeChannels";
import { SingleMessage } from "../../../../components/singleMessage";
import { prisma } from "../../../../server/prisma";
import {
  getAllChannelsInTeam,
  getMessagesWithUser,
} from "../../../../server/slack";
import { MessageWithUser } from "../../../../types";

type ServerSideProps = {
  messages: MessageWithUser[];
  channels: SlackChannel[];
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async ({
  query: { teamId, channelId },
}) => {
  if (typeof teamId !== "string" || typeof channelId !== "string") {
    return {
      props: { messages: [], channels: [] },
    };
  }

  const [allMessages, channlesInTeam] = await Promise.all([
    getMessagesWithUser({ channelId, teamId }),
    getAllChannelsInTeam({ teamId }),
  ]);
  return {
    props: { messages: allMessages, channels: channlesInTeam },
  };
};

export const RenderChannel: NextPage<ServerSideProps> = ({
  messages,
  channels,
}) => {
  const router = useRouter();
  const { channelId, teamId } = router.query as {
    channelId: string;
    teamId: string;
  };
  return (
    <div>
      <div className="flex flex-col gap-y-8">
        {messages.map((message) => {
          return (
            <SingleMessage
              key={message.id}
              createdAt={message.createdAt}
              message={message.slackMessage}
              userName={message.slackUser.slackRealName}
            />
          );
        })}
      </div>
      <div className="absolute bottom-0 w-full">
        <ChangeChannels
          channels={channels}
          currentChannelId={channelId}
          teamId={teamId}
        />
      </div>
    </div>
  );
};

export default RenderChannel;
