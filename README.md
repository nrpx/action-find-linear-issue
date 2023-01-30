# action-find-linear-issue

This is a [Github Action](https://github.com/features/actions) that finds a [Linear](https://linear.app/) Issue in your Pull Request.

This is helpful when you're:

- Ensuring each Pull Request has a Linear Issue.
- Making a forced PR title/description updates depends on data from Linear
- Adjusting release notes on GitHub or somewhere else via PRs (actions) and Linear Issues 

## Inputs

| Input                 | Description                                                                        | Required |
|-----------------------|------------------------------------------------------------------------------------|----------|
| `linear-api-key`      | Linear API key generated from https://linear.app/settings/api . (e.g. `lin_api_*)` | ✅        |
| `output-multiple`     | Find multiple issues and output a JSON array of results (default `false`)          | 🚫       |
| `include-title`       | Taking the PR title into account to find issues (default `false`)                  | 🚫       |
| `include-description` | Taking the PR description into account to find issues (default `false`)            | 🚫       |
| `include-branch-name` | Taking the PR branch name into account to find issues (default `true`)             | 🚫       |
| `with-team`           | Include `team` node into each resulted `issue` (default `true`)                    | 🚫       |
| `with-labels`         | Include `labels` nodes into each resulted `issue` (default `true`)                 | 🚫       |

## Outputs

| Output          | Description                                                      |
|-----------------|------------------------------------------------------------------|
| `linear-issue`  | The Linear issue in JSON format                                  |
| `linear-issues` | The Linear issues as JSON array (when `output-multiple` is used) |

## Example usage

### Create a comment with Linear Issue on Pull Request

```yaml
name: Find Linear Issue in Pull Request

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main
    types: [opened, reopened]

jobs:
  comment-with-linear-issue-on-pull-request:
    runs-on: ubuntu-latest
    steps:
      - name: Find the Linear Issue
        id: findIssue
        uses: nrpx/action-find-linear-issue@v1
        with:
          linear-api-key: ${{secrets.LINEAR_API_KEY}}

      - name: Create comment in PR with Linear Issue link
        uses: peter-evans/create-or-update-comment@v2
        env:
          issue_identifier: ${{ fromJson(steps.findIssue.outputs.linear-issue).identifier }}
          issue_title: ${{ fromJson(steps.findIssue.outputs.linear-issue).title }}
          issue_url: ${{ fromJson(steps.findIssue.outputs.linear-issue).url }}
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            [${{ env.issue_identifier }}: ${{ env.issue_title }}](${{ env.issue_url }})
```
