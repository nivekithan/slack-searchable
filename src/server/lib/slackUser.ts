import { prisma } from "../db/client";

export type SlackUserInfoArgs = {
  slackTeamId: string;
  slackUserId: string;
};

/**
 * Given SlackTeamId and SlackUserId, we will query the database to find
 * if there is a SlackUser with the given SlackTeamId and SlackUserId.
 * 
 * TODO:
 * - Implement cache so that we don't have to query the database everytime
 * 
 */
export const isSlackUserExists = async ({
  slackTeamId,
  slackUserId,
}: SlackUserInfoArgs) => {
  try {
    const slackUser = await prisma.slackUser.findUnique({
      where: { slackUserId_slackTeamId: { slackTeamId, slackUserId } },
    });

    return slackUser !== null;
  } catch (err) {
    throw new Error("Error in slackUserExists", { cause: err });
  }
};
