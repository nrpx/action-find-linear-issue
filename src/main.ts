import { debug, setFailed, getInput, setOutput } from "@actions/core";
import { LinearClient, LinearClientOptions } from "@linear/sdk";
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
    const inputs = {
      apiKey: getInput("linear-api-key", { required: true }),
      outputMultiple: boolCheck(getInput("output-multiple")),
      includeTitle: boolCheck(getInput("include-title")),
      includeDescription: boolCheck(getInput("include-description")),
      includeBranchName: boolCheck(getInput("include-branch-name"), true),
      withTeam: boolCheck(getInput("with-team"), true),
      withLabels: boolCheck(getInput("with-labels"), true),
    };

    type PartsWithOpts<Type> = {
      [Property in keyof Type]: { value: string | undefined; flag: boolean };
    };
    type PartsType = PartsWithOpts<{ branch: void; title: void; body: void }>;
    const prParts: PartsType = {
      branch: {
        value: context.payload.pull_request?.head.ref,
        flag: inputs.includeBranchName,
      },
      title: {
        value: context.payload.pull_request?.title,
        flag: inputs.includeTitle,
      },
      body: {
        value: context.payload.pull_request?.body,
        flag: inputs.includeDescription,
      },
    };

    for (const [partName, partOpts] of Object.entries(prParts)) {
      debug(`PR ${partName}: ${partOpts.value}`);
      if (partOpts.value === undefined && partOpts.flag) {
        setFailed(`Could not load PR ${partName}`);
        return;
      }
    }

    const linearClient = new LinearClient({
      ...(inputs as LinearClientOptions),
    });
    const teams = await getTeams(linearClient);
    if (!teams.length) {
      setFailed(`No teams found in Linear workspace`);
      return;
    }

    const teamKeys = teams.map((team) => team.key);
    const regexStr = `(?<!A-Za-z)(${teamKeys.join("|")})-(\\d+)`;
    const regExp = new RegExp(regexStr, "gim");
    const haystack = Object.values(prParts)
      .map(({ value, flag }) => {
        return flag ? value : undefined;
      })
      .filter(Boolean)
      .join(" ");
    debug(`Checking PR for identifier "${regexStr}" in "${haystack}"`);

    const matches = haystack.match(regExp);
    if (matches?.length) {
      debug(`Found numbers: ${matches.join(", ")}`);

      const issueNumbers = inputs.outputMultiple
        ? matches.map(matchToIssueNumber)
        : [matchToIssueNumber(matches[0])];
      const issues = await getIssues(linearClient, ...issueNumbers);

      if (issues.length) {
        const foundIssues = issues.map(async (issue) => {
          return {
            ...issue,
            team: inputs.withTeam ? await issue.team : null,
            labels: inputs.withLabels ? (await issue.labels()).nodes : null,
          };
        });

        if (inputs.outputMultiple) {
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
