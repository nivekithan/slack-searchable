import { Message, Reply, SlackUser } from "@prisma/client";

export type MessageWithUserAndReplies = Message & {
  slackUser: SlackUser;
  replies: (Reply & {
    slackUser: SlackUser;
  })[];
};
