import { SlackChannel } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeChannels } from "../../../../components/changeChannels";
import { SingleMessage } from "../../../../components/singleMessage";
import {
  getAllChannelsInTeam,
  getMessagesWithUser,
} from "../../../../server/slack";
import { MessageWithUser } from "../../../../types";

type ServerSideProps = {
  messages: MessageWithUser[];
  channels: SlackChannel[];
  nextSkip: number | null;
  prevSkip: number | null | "showFirstPage";
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context
) => {
  const {
    query: { teamId, channelId, skip },
  } = context;

  if (typeof teamId !== "string" || typeof channelId !== "string") {
    return {
      props: { messages: [], channels: [], nextSkip: null, prevSkip: null },
    };
  }

  const numberOfMessagesToShow = 25;
  const parsedNextSkip = parseNextSkip(skip);
  const previousNextSkip = getPreviousSkip(
    parsedNextSkip,
    numberOfMessagesToShow
  );

  const [allMessages, channlesInTeam] = await Promise.all([
    getMessagesWithUser({
      channelId,
      teamId,
      skip: parsedNextSkip ? parsedNextSkip : undefined,
      take: numberOfMessagesToShow + 1,
    }),
    getAllChannelsInTeam({ teamId }),
  ]);

  const nextCursor = getNextSkip(allMessages, numberOfMessagesToShow + 1);

  if (nextCursor !== null) {
    allMessages.pop();
  }

  return {
    props: {
      messages: allMessages,
      channels: channlesInTeam,
      nextSkip: nextCursor,
      prevSkip: previousNextSkip,
    },
  };
};

const parseNextSkip = (skip: string | string[] | undefined) => {
  if (typeof skip === "string") {
    const skipAsId = parseInt(skip, 10);

    if (Number.isNaN(skipAsId)) {
      return null;
    }

    return skipAsId;
  }

  return null;
};

const getNextSkip = (messages: MessageWithUser[], expectedMessages: number) => {
  if (messages.length !== expectedMessages) {
    return null;
  }

  const lastMessage = messages.at(-1);

  if (lastMessage === undefined) {
    return null;
  }

  return lastMessage.sortKey;
};

const getPreviousSkip = (
  currentSkip: number | null,
  numberOfMessagesToShow: number
): "showFirstPage" | number | null => {
  if (currentSkip === null) {
    return null;
  }

  const previousSkip = currentSkip - numberOfMessagesToShow;

  if (previousSkip <= 0) {
    return "showFirstPage";
  }

  return previousSkip;
};

export const RenderChannel: NextPage<ServerSideProps> = ({
  messages,
  channels,
  nextSkip,
  prevSkip,
}) => {
  const router = useRouter();
  const { channelId, teamId } = router.query as {
    channelId: string;
    teamId: string;
  };

  return (
    <div className="flex flex-col gap-y-12">
      <div className="flex flex-col gap-y-4">
        {messages.map((message) => {
          const replyHref = `/t/${teamId}/c/${channelId}/${message.id}`;
          return (
            <div className="flex flex-col gap-y-8">
              <SingleMessage
                key={message.id}
                createdAt={message.createdAt}
                message={message.slackMessage}
                userName={message.slackUser.slackRealName}
              />
              <Link href={replyHref}>
                <a className="text-sm text-blue-600 hover:underline  w-fit hover:rounded">
                  Show Replies
                </a>
              </Link>
            </div>
          );
        })}
      </div>
      <Pagination
        nextSkip={nextSkip}
        prevSkip={prevSkip}
        channelId={channelId}
        teamId={teamId}
      />
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

type PaginationProps = {
  nextSkip: number | null;
  prevSkip: number | null | "showFirstPage";
  teamId: string;
  channelId: string;
};

const Pagination = ({
  nextSkip,
  prevSkip,
  teamId,
  channelId,
}: PaginationProps) => {
  const pathName = `/t/${teamId}/c/${channelId}`;

  return (
    <div className="flex items-center justify-between">
      <ChangeSkip
        newSkip={prevSkip}
        pathName={pathName}
        query={{ prevSkip: prevSkip }}
        text="Previous"
      />
      <ChangeSkip
        newSkip={nextSkip}
        pathName={pathName}
        query={{ skip: nextSkip }}
        text="Next"
      />
    </div>
  );
};

type ChangeSkipProps = {
  newSkip: number | null | "showFirstPage";
  text: string;
  pathName: string;
  query: Record<string, string | number | null>;
};

const ChangeSkip = ({ newSkip, text, pathName, query }: ChangeSkipProps) => {
  const isLinkToFirstPage = newSkip === "showFirstPage";
  const isNewSkipAvaliable = newSkip !== null;

  const commonStyling = "border rounded-md text-md px-3 py-2";

  const ToFirstPage = (
    <div className={`${commonStyling} hover:border-blue-600`}>
      <Link href={{ pathname: pathName }}>
        <a>{text}</a>
      </Link>
    </div>
  );

  const ToNewSkip = (
    <div className={`${commonStyling} hover:border-blue-600 `}>
      <Link href={{ pathname: pathName, query: query }}>
        <a>{text}</a>
      </Link>
    </div>
  );

  const NoNewSkip = (
    <div className={`${commonStyling} text-gray-400 cursor-not-allowed`}>
      <p>{text}</p>
    </div>
  );

  return isLinkToFirstPage
    ? ToFirstPage
    : isNewSkipAvaliable
    ? ToNewSkip
    : NoNewSkip;
};

export default RenderChannel;
