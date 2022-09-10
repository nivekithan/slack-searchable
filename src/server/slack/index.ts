import { WebClient } from "@slack/web-api";
import { z } from "zod";

export type GetUserInfoFromSlackArgs = {
  userId: string;
  slackToken: string;
};
const slackUserSchema = z.object({
  // userId for the user
  id: z.string(),

  real_name: z.string(),
});

/**
 * Queris the slack api to getUserInfo for the given userId. 
 * 
 * 
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
