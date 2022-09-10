import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../../../server/db/client";
import { getEnvVar } from "../../../../utils/env";
import { nanoid } from "nanoid";
import { isSlackUserExists } from "../../../../server/lib/slackUser";
import { Prisma } from "@prisma/client";
import {
  getChannelInfoFromSlack,
  getUserInfoFromSlack,
} from "../../../../server/slack";
import { isSlackChannelExists } from "../../../../server/lib/slackChannel";

export const config = {
  api: {
    // Prevent automatic body parsing by Next.js for verfiying the request
    // is acutally from slack only.
    bodyParser: false,
  },
};

type SlackEvent =
  | {
      type: "url_verification";
      token: string;
      challenge: string;
    }
  | { type: "event_callback"; event: SlackSubEvent };

type SlackSubEvent = {
  type: "message";
  text: string;
  user: string;
  team: string;
  channel: string;
  ts: string;
};

type HandleSlackEventsArgs = {
  req: NextApiRequest;
  res: NextApiResponse;
  json: unknown;
};

const slackMessageSubEvent = z.object({
  // Non formatted message sent
  // by slack
  text: z.string(),

  // userId who sent the message
  user: z.string(),

  // ts is the unique id of the message in the channel
  ts: z.string(),

  // teamId the message belongs to
  team: z.string(),

  // channelId the message was sent to
  channel: z.string(),

  // if the message is part of thread then this will be set
  // and the value will be equal to the ts of the parent message
  thread_ts: z.optional(z.string()),
});

const handleSlackEvent = async ({ req, res, json }: HandleSlackEventsArgs) => {
  const slackEvent = json as SlackEvent;

  console.log(JSON.stringify(slackEvent, null, 2));

  // When we configure the slack app, we will provide
  // a event url. Where slack will make a POST request with event information.
  //
  // Slack will verify that event url by making a post request with body
  // {type : "url_verification", token : string, challenge : string}
  //
  // To prove that we own the event url. We have to send the challenge
  // back to slack.
  if (slackEvent.type === "url_verification") {
    return res.send(slackEvent.challenge);
  }

  // When slack actually sends an event. We will have to send an acknowledgement
  // response within 3 seconds. Otherwise slack will retry the request.
  // Recommed way to do this is to send a 200 response with body "OK" before
  // we started to process the event.

  await res.send("OK");

  // All slack events have same outer event type that is `event_callback`.
  // So if we get something else, we can just ignore it
  if (slackEvent.type !== "event_callback") {
    return;
  }

  const subEvent = slackEvent.event;

  if (subEvent.type === "message") {
    const parsedSubEvent = slackMessageSubEvent.safeParse(subEvent);

    if (!parsedSubEvent.success) {
      console.log("Unknown data format. Ignoring this event");
      return;
    }

    const {
      text: message,
      user: userId,
      ts,
      team: teamId,
      channel: channelId,
      thread_ts: slackThreadTs,
    } = parsedSubEvent.data;

    const isPartOfThread = slackThreadTs !== undefined;

    const [slackUser, slackChannel] = await Promise.all([
      prismaSlackUser({ teamId, userId }),
      prismaSlackChannel({ channelId, teamId }),
    ]);

    if (!isPartOfThread) {
      await prisma.message.create({
        data: {
          slackMessage: message,
          slackMessageTs: ts,
          slackUser,
          slackChannel,
        },
      });
    } else {
      await prisma.reply.create({
        data: {
          slackMessage: message,
          slackMessageTs: ts,
          slackUser,
          slackChannel,
          message: {
            connect: {
              slackChannelId_slackMessageTs_slackTeamId: {
                slackChannelId: channelId,
                slackMessageTs: slackThreadTs,
                slackTeamId: teamId,
              },
            },
          },
        },
      });
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Slack only sends POST request to the event url.
  // So we can send 404 response for all other methods.
  if (req.method === "POST") {
    const body = await parseBody(req);
    const isVerified = verifyRequestIsActuallyFromSlack(req, body.raw);

    if (!isVerified) {
      return res.status(401).send("Unauthorized");
    }

    return handleSlackEvent({ req, res, json: body.json });
  }

  return res.status(404).end();
}
// We have to get the body of the request made by Slack.
// We can't use default body parser that is included in
// Next.js because it doesn't support raw body parsing.
// And we need raw body to verify the request is actually from
// the slack only.
const parseBody = async <ParsedBody = unknown>(req: NextApiRequest) => {
  return new Promise<{ raw: string; json: ParsedBody }>((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      return resolve({ raw: body, json: JSON.parse(body) });
    });

    req.on("error", (err) => {
      return reject(err);
    });
  });
};

// We have to make sure that the request we got is
// acutally from Slack only. For reference
// https://api.slack.com/authentication/verifying-requests-from-slack
const verifyRequestIsActuallyFromSlack = (
  req: NextApiRequest,
  rawBody: string
) => {
  const headers = req.headers;

  const timeStampInStr = headers["x-slack-request-timestamp"];

  if (typeof timeStampInStr !== "string") {
    return false;
  }

  const timeStamp = parseInt(timeStampInStr, 10);

  if (Number.isNaN(timeStamp)) {
    return false;
  }

  const currentTimeInSeconds = new Date().getTime() / 1000;

  const fiveMinutes = 60 * 5;

  if (currentTimeInSeconds - timeStamp > fiveMinutes) {
    return false;
  }

  const baseString = `v0:${timeStamp}:${rawBody}`;

  const hmac = createHmac("sha256", getEnvVar("SLACK_SIGNING_SECRET"));
  hmac.update(baseString);

  const expectedSignatureHash = `v0=${hmac.digest("hex")}`;
  const actualSignatureHash = headers["x-slack-signature"];

  return expectedSignatureHash === actualSignatureHash;
};

type PrismaSlackUserArgs = { teamId: string; userId: string };

/**
 * Each message/reply is assoicated with a SlackUser. A slack user can be
 * identified by slackUserId, slackTeamId.
 *
 * So we will check the db to make sure that there already exist a user with
 * the same slackUserId, slackTeamId. if not that means this member
 * has messaged for fist time since our app has been installed.
 *
 * So we will get required data (real_name) using slack_api and then store the
 * data in db.
 *
 */
const prismaSlackUser = async ({ teamId, userId }: PrismaSlackUserArgs) => {
  const isSlackUserPresent = await isSlackUserExists({
    slackTeamId: teamId,
    slackUserId: userId,
  });

  if (isSlackUserPresent) {
    /**
     * Since a slackUser is already present in the db. We will connect
     * our message/reply to that user.
     */
    const slackUser: Prisma.SlackUserCreateNestedOneWithoutMessageInput = {
      connect: {
        slackUserId_slackTeamId: {
          slackTeamId: teamId,
          slackUserId: userId,
        },
      },
    };

    return slackUser;
  } else {
    const slackUserData = await getUserInfoFromSlack({
      slackToken: getEnvVar("SLACK_BOT_USER_TOKEN"),
      userId: userId,
    });

    if (slackUserData instanceof Error) {
      throw slackUserData;
    }
    /**
     * We don't have to create a slackUser in db ourselves. By using `create` option.
     * prisma will do that for us automatically.
     */
    const slackUser: Prisma.SlackUserCreateNestedOneWithoutMessageInput = {
      create: {
        slackRealName: slackUserData.real_name,
        slackUserId: userId,
        slackTeamId: teamId,
        id: nanoid(),
      },
    };

    return slackUser;
  }
};

type PrismaSlackChannelArgs = { teamId: string; channelId: string };
/**
 * Each message/reply is assoicated with a SlackChannel. A slack channel can be
 * identified by slackTeamId, slackChannelId.
 *
 * So we will check the db to make sure that there already exist a user with
 * the same slackTeamId, slackChannelId. if not that means this channel
 * has been messaged for fist time since our app has been installed.
 *
 * So we will get required data using slack_api and then store the
 * data in db.
 *
 */
const prismaSlackChannel = async ({
  teamId,
  channelId,
}: PrismaSlackChannelArgs) => {
  const isSlackChannelPresent = await isSlackChannelExists({
    slackTeamId: teamId,
    slackChannelId: channelId,
  });

  if (isSlackChannelPresent) {
    /**
     * Since a slackChannel is already present in the db. We will connect
     * our message/reply to that channel.
     */
    const slackChannel: Prisma.SlackChannelCreateNestedOneWithoutMessageInput =
      {
        connect: {
          slackTeamId_slackChannelId: {
            slackChannelId: channelId,
            slackTeamId: teamId,
          },
        },
      };

    return slackChannel;
  } else {
    const slackChannelData = await getChannelInfoFromSlack({
      slackToken: getEnvVar("SLACK_BOT_USER_TOKEN"),
      channelId: channelId,
    });

    if (slackChannelData instanceof Error) {
      throw slackChannelData;
    }
    /**
     * We don't have to create a slackChannel in db ourselves. By using `create` option.
     * prisma will do that for us automatically.
     */
    const slackChannel: Prisma.SlackChannelCreateNestedOneWithoutMessageInput =
      {
        create: {
          slackChannelId: channelId,
          slackChannelName: slackChannelData.name,
          slackTeamId: teamId,
          id: nanoid(),
        },
      };

    return slackChannel;
  }
};
