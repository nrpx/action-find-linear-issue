import { Issue, LinearClient, Team } from "@linear/sdk";

export type IssueNumber = {
  teamKey: string;
  issueNumber: number;
};

/**
 * Gets an issue using the provided team and issueNumber
 * @param linearClient LinearClient instance
 * @param issueNumbers Issue numbers with team key to search
 * @returns The issues if they exists
 */
const getIssues = async (
  linearClient: LinearClient,
  ...issueNumbers: IssueNumber[]
): Promise<Issue[]> => {
  const issues = await linearClient.issues({
    filter: {
      or: issueNumbers.map((issueNumber) => {
        return {
          and: [
            { team: { key: { eq: issueNumber.teamKey } } },
            { number: { eq: issueNumber.issueNumber } },
          ],
        };
      }),
    },
  });

  if (!issues.nodes.length) {
    console.log(`Failed to find any issues`);
  }

  return issues.nodes;
};

export default getIssues;
