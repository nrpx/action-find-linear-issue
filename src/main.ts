import { debug, setFailed, getInput, setOutput } from "@actions/core";
import { LinearClient } from "@linear/sdk";
import { context } from "@actions/github";
import getTeams from "./getTeams";
import getIssues, { IssueNumber } from "./getIssues";

const main = async () => {
  const boolCheck = (
    arg: string | undefined,
    defValue: boolean = false
  ): boolean => {
    return arg === undefined ? defValue : arg === "true";
  };

  const matchToIssueNumber = (issueStr: string): IssueNumber => {
    const [teamKey, issueNumber] = issueStr.split("-");
    return { teamKey, issueNumber: Number(issueNumber) };
  };

  try {
    const linearApiKeyInput = getInput("linear-api-key", { required: true });
    const outputMultipleInput: boolean = boolCheck(getInput("output-multiple"));
    const includeTitleInput: boolean = boolCheck(getInput("include-title"));
    const includeDescriptionInput: boolean = boolCheck(
      getInput("include-description")
    );
    const includeBranchNameInput: boolean = boolCheck(
      getInput("include-branch-name"),
      true
    );
    const withTeamInput: boolean = boolCheck(getInput("with-team"), true);
    const withLabelsInput: boolean = boolCheck(getInput("with-labels"), true);

    const prBranch: string | undefined = context.payload.pull_request?.head.ref;
    debug(`PR Branch: ${prBranch}`);
    if (!prBranch && includeBranchNameInput) {
      setFailed(`Could not load PR branch`);
      return;
    }

    const prTitle: string | undefined = context.payload.pull_request?.title;
    debug(`PR Title: ${prTitle}`);
    if (!prTitle && includeTitleInput) {
      setFailed(`Could not load PR title`);
      return;
    }

    const prBody: string | undefined = context.payload.pull_request?.body;
    debug(`PR Body: ${prBody}`);
    if (prBody === undefined && includeDescriptionInput) {
      setFailed(`Could not load PR body`);
      return;
    }

    const linearClient = new LinearClient({ apiKey: linearApiKeyInput });
    const teams = await getTeams(linearClient);
    if (!teams.length) {
      setFailed(`No teams found in Linear workspace`);
      return;
    }

    const teamKeys = teams.map((team) => team.key);
    const regexStr = `(?<!A-Za-z)(${teamKeys.join("|")})-(\\d+)`;
    const regExp = new RegExp(regexStr, "gim");
    const haystack = [
      includeBranchNameInput ? prBranch : undefined,
      includeTitleInput ? prTitle : undefined,
      includeDescriptionInput ? prBody : undefined,
    ]
      .filter((str) => str !== undefined)
      .join(" ");
    debug(`Checking PR for identifier "${regexStr}" in "${haystack}"`);

    const matches = haystack.match(regExp);
    if (matches?.length) {
      debug(`Found numbers: ${matches.join(", ")}`);

      const issueNumbers = outputMultipleInput
        ? matches.map(matchToIssueNumber)
        : [matchToIssueNumber(matches[0])];
      const issues = await getIssues(linearClient, ...issueNumbers);

      if (issues.length) {
        const foundIssues = issues.map(async (issue) => {
          return {
            ...issue,
            team: withTeamInput ? await issue.team : null,
            labels: withLabelsInput ? (await issue.labels()).nodes : null,
          };
        });

        if (outputMultipleInput) {
          setOutput("linear-issues", JSON.stringify(foundIssues));
        } else {
          setOutput("linear-issue", JSON.stringify(foundIssues[0]));
        }
      }
    }

    setFailed(
      `Failed to find Linear issue identifier in PR branch, title, or body.`
    );
    return;
  } catch (error) {
    setFailed(`${(error as any)?.message ?? error}`);
  }
};

main();
