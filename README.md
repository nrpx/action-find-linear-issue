# action-find-linear-issue

This is a [Github Action](https://github.com/features/actions) that finds a [Linear](https://linear.app/) Issue in your Pull Request.

This is helpful when you're:

- Ensuring each Pull Request has a Linear Issue.

## Inputs

| Input            | Description                                                   | Required |
| ---------------- | ------------------------------------------------------------- | -------- |
| `linear-api-key` | Linear API key generated from https://linear.app/settings/api | ✅       |

## Outputs

| Output                     | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `linear-issue-id`          | The Linear issue's unique identifier. (UUID)                 |
| `linear-issue-identifier`  | The Linear issue's human readable identifier. (e.g. ENG-123) |
| `linear-issue-number`      | The Linear issue's number. (e.g. the 123 of ENG-123)         |
| `linear-issue-title`       | The Linear issue's title.                                    |
| `linear-issue-description` | The Linear issue's description.                              |
| `linear-issue-url`         | The Linear issue's URL. (e.g. https://...)                   |
| `linear-team-id`           | The Linear teams unique identifier. (UUID)                   |
| `linear-team-key`          | The Linear teams key/prefix (e.g. ENG)                       |

## Example usage

### Create Linear Issue on Pull Request

```yaml
name: Create Linear Issue on Pull Request

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main
    types: [opened, reopened]

jobs:
  create-linear-issue-on-pull-request:
    runs-on: ubuntu-latest
    steps:
      - name: Create the Linear Issue
        id: createIssue
        uses: ctriolo/action-find-linear-issue@v1
        with:
          linear-api-key: ${{secrets.LINEAR_API_KEY}}

      - name: Create comment in PR with Linear Issue link
        uses: peter-evans/create-or-update-comment@v2
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            ${{ steps.createIssue.outputs.linear-issue-url }}"
```
