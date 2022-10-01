import { Settings } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { SettingsList } from "../../../components/settingsList";
import { getSettingsForTeam } from "../../../server/slack";

type ServerSideProps = {
  settings: Settings;
};

export const getServerSideProps: GetServerSideProps<ServerSideProps> = async (
  context
) => {
  const { teamId } = context.query;

  if (typeof teamId !== "string") {
    throw new Error("It should not have happend");
  }

  const teamSettings = await getSettingsForTeam({ teamId });

  if (teamSettings === null) {
    return { notFound: true };
  }

  return {
    props: { settings: teamSettings },
  };
};

export const TeamSettings: NextPage<ServerSideProps> = ({ settings }) => {
  const router = useRouter();
  const { teamId } = router.query as { teamId: string };
  return <SettingsList currentSettings={settings} teamId={teamId} />;
};

export default TeamSettings;
