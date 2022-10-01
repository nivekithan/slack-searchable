import { WebClient } from "@slack/web-api";
import { z } from "zod";
import { prisma } from "../prisma";

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

export type GetAllChannelsInTeamArgs = {
  teamId: string;
};

export const getAllChannelsInTeam = async ({
  teamId,
}: GetAllChannelsInTeamArgs) => {
  const channels = await prisma.slackChannel.findMany({
    where: { slackTeamId: teamId },
    orderBy: { createdAt: "desc" },
  });

  return channels;
};

export type GetChannelMessagesWithUserArgs = {
  teamId: string;
  channelId: string;
  take: number;
  skip?: number;
};
export const getMessagesWithUser = async ({
  teamId,
  channelId,
  take,
  skip,
}: GetChannelMessagesWithUserArgs) => {
  const messages = await prisma.message.findMany({
    where: { slackTeamId: teamId, slackChannelId: channelId },
    include: {
      slackUser: true,
    },
    orderBy: { createdAt: "desc" },
    take: take,
    skip: skip,
  });

  return messages;
};

export type GetAMessageWithRepliesAndUserArgs = {
  teamId: string;
  channelId: string;
  messageTs: string;
};

export const getAMessageWithRepliesAndUser = async ({
  channelId,
  messageTs,
  teamId,
}: GetAMessageWithRepliesAndUserArgs) => {
  const messages = prisma.message.findUnique({
    where: {
      slackChannelId_slackMessageTs_slackTeamId: {
        slackChannelId: channelId,
        slackMessageTs: messageTs,
        slackTeamId: teamId,
      },
    },
    include: {
      replies: {
        include: { slackUser: true },
      },
      slackUser: true,
    },
  });

  return messages;
};

export type GetSettingsForTeamArgs = {
  teamId: string;
};
export const getSettingsForTeam = async ({
  teamId,
}: GetSettingsForTeamArgs) => {
  return prisma.settings.findUnique({ where: { slackTeamId: teamId } });
};
