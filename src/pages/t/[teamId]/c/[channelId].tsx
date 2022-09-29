import { useRouter } from "next/router";

export const RenderChannel = () => {
  const routuer = useRouter();
  const { teamId, channelId } = routuer.query;

  return (
    <p>
      ChannelId : {channelId}, TeamId : {teamId}
    </p>
  );
};

export default RenderChannel;
