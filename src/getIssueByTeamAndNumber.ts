import { Issue, LinearClient, Team } from "@linear/sdk";

/**
 * Gets an issue using the provided team and issueNumber
 * @param linearClient LinearClient instance
 * @param team Linear team object
 * @param issueNumber Issue number to search for the "123" in "ENG-123"
 * @returns The issue if it exists
 */
const getIssueByTeamAndNumber = async (
  linearClient: LinearClient,
  team: Team,
  issueNumber: number
): Promise<Issue | null> => {
  const issues = await linearClient.issues({
    filter: {
      team: {
        id: {
          eq: team.id,
        },
      },
      number: {
        eq: issueNumber,
      },
    },
  });

  if (issues.nodes.length === 0) {
    console.log(`Failed to find issue ${team.key}-${issueNumber}`);
    return null;
  }

  return issues.nodes[0];
};

export default getIssueByTeamAndNumber;
