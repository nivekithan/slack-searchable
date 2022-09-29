import { Message, Reply, SlackUser } from "@prisma/client";

export type MessageWithUser = Message & {
  slackUser: SlackUser;
};

export type MessageWithUserAndReplies = Message &
  MessageWithUser & {
    replies: (Reply & {
      slackUser: SlackUser;
    })[];
  };
