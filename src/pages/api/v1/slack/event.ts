import type { NextApiRequest, NextApiResponse } from "next";
import { createHmac } from "node:crypto";
import { getEnvVar } from "../../../../utils/env";

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
    // This is the subevent slack sends when a message is sent in a channel.

    const message = subEvent.text;
    const userId = subEvent.user; // User who sent the message
    const teamId = subEvent.team; // Team the message belongs
    const channelId = subEvent.channel; // Channel the message was sent to
    const ts = subEvent.ts; // Unqiue id of message in channel only
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body = await parseBody(req);
  const isVerified = verifyRequestIsActuallyFromSlack(req, body.raw);

  if (!isVerified) {
    return res.status(401).send("Unauthorized");
  }

  // Slack only sends POST request to the event url.
  // So we can send 404 response for all other methods.
  if (req.method === "POST") {
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
