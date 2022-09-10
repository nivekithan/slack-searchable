import { WebClient } from "@slack/web-api";
import { z } from "zod";

const slackUserSchema = z.object({
  // userId for the user
  id: z.string(),

  real_name: z.string(),
});

export type GetUserInfoFromSlackArgs = {
  userId: string;
  slackToken: string;
};
/**
 * Queris the slack api to getUserInfo for the given userId.
 */
export const getUserInfoFromSlack = async ({
  userId,
  slackToken,
}: GetUserInfoFromSlackArgs) => {
  try {
    const slackClient = new WebClient(slackToken);
    const userInfoRes = await slackClient.users.info({ user: userId });

    if (userInfoRes.error) {
      throw new Error(userInfoRes.error);
    }

    const user = slackUserSchema.parse(userInfoRes.user);

    return user;
  } catch (err) {
    return new Error("Error getting user info from Slack", { cause: err });
  }
};

export type GetChannelInfoFromSlackArgs = {
  slackToken: string;
  channelId: string;
};

const slackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_channel: z.literal(true),
});

export const getChannelInfoFromSlack = async ({
  channelId,
  slackToken,
}: GetChannelInfoFromSlackArgs) => {
  try {
    const slackClient = new WebClient(slackToken);
    const channelInfoRes = await slackClient.conversations.info({
      channel: channelId,
    });

    if (channelInfoRes.error) {
      throw new Error(channelInfoRes.error);
    }

    return slackChannelSchema.parse(channelInfoRes.channel);
  } catch (err) {
    return new Error("Error getting channel info from Slack", { cause: err });
  }
};
