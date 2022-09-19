/**
 * Renders whole thread with top message and all replies.
 */

import { MessageWithUserAndReplies } from "../types";
import { SingleMessage } from "./singleMessage";

export type ThreadProps = {
  thread: MessageWithUserAndReplies;
};

export const Thread = ({ thread: message }: ThreadProps) => {
  return (
    <div className="flex flex-col gap-y-8">
      <SingleMessage
        message={message.slackMessage}
        userName={message.slackUser.slackRealName}
        createdAt={message.createdAt}
      />
      {message.replies.map((reply) => {
        return (
          <SingleMessage
            key={reply.id}
            message={reply.slackMessage}
            userName={reply.slackUser.slackRealName}
            createdAt={reply.createdAt}
          />
        );
      })}
    </div>
  );
};
