import { LinearClient, Team } from "@linear/sdk";

const getTeams = async (linearClient: LinearClient): Promise<Team[]> => {
  const teams = await linearClient.teams();
  return teams.nodes;
};

export default getTeams;
