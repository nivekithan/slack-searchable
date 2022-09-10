import { prisma } from "../db/client";

export type SlackChannelInfoArgs = {
  slackTeamId: string;
  slackChannelId: string;
};

/**
 * Given SlackTeamId and SlackChannelId, we will query the database to find
 * if there is a SlackChannel with the given SlackTeamId and SlackChannelId.
 *
 * TODO:
 * - Implement cache so that we don't have to query the database everytime
 *
 */
export const isSlackChannelExists = async ({
  slackTeamId,
  slackChannelId,
}: SlackChannelInfoArgs) => {
  try {
    const slackChannel = await prisma.slackChannel.findUnique({
      where: {
        slackTeamId_slackChannelId: { slackChannelId, slackTeamId },
      },
    });

    return slackChannel !== null;
  } catch (err) {
    throw new Error("Error in slackChannelExist", { cause: err });
  }
};
