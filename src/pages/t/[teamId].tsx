import { useRouter } from "next/router";

export const TeamSlack = () => {
  const router = useRouter();
  const { teamId } = router.query;

  return <p>{teamId}</p>;
};

export default TeamSlack;
