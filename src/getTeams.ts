import { LinearClient, Team } from "@linear/sdk";

const getTeams = async (linearClient: LinearClient): Promise<Team[]> =>
  (await linearClient.teams()).nodes;

export default getTeams;
