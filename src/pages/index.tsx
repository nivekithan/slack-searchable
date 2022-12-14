import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { Thread } from "../components/thread";
import { prisma } from "../server/prisma";
import { MessageWithUserAndReplies } from "../types";

const staticSlackInfo = {
  teamId: "T040WFQ9QAZ",
  channelId: "C040SSFN6TY",
  messageTs: "1663492337.707879",
};

type ServerSideProps = {
  thread: MessageWithUserAndReplies;
};

export const getServerSideProps: GetServerSideProps<
  ServerSideProps
> = async () => {
  const message: MessageWithUserAndReplies | null =
    await prisma.message.findUnique({
      where: {
        slackChannelId_slackMessageTs_slackTeamId: {
          slackChannelId: staticSlackInfo.channelId,
          slackMessageTs: staticSlackInfo.messageTs,
          slackTeamId: staticSlackInfo.teamId,
        },
      },
      include: {
        replies: {
          include: { slackUser: true },
        },
        slackUser: true,
      },
    });

  if (message === null) {
    throw new Error("Not supposed to happen");
  }

  message.replies;

  return {
    props: {
      thread: message,
    },
  };
};

const Home: NextPage<ServerSideProps> = ({ thread }) => {
  return (
    <>
      <Head>
        <title>Slack Searchable</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Thread thread={thread} />
    </>
  );
};

export default Home;
