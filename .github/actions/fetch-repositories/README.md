# Fetch Repositories Action

This GitHub Action fetches repository data from GitHub's API based on organizations and topics, then generates a JSON file that can be used by the git-catalogue Angular application.

## Features

- ✅ **Global & Organization-specific search**: Search across all GitHub or restrict to specific organizations
- ✅ **Multi-organization support**: Fetch repositories from multiple GitHub organizations
- ✅ **Topic-based filtering**: Filter repositories by specific GitHub topics
- ✅ **Rate limiting protection**: Built-in rate limiting and retry logic
- ✅ **Configurable pagination**: Customize the number of results per API call
- ✅ **Error handling**: Graceful error handling with fallback options
- ✅ **Output validation**: Validates generated JSON structure
- ✅ **Optimized data**: Only includes fields actually used by the catalogue (~80% size reduction)

## Performance Optimization

The action only includes repository fields that are actually used by the git-catalogue UI:

**Included fields (20 vs 100+):**
- Core: `id`, `name`, `full_name`, `description`, `stargazers_count`, `created_at`, `default_branch`
- Owner: `login`, `avatar_url`, `html_url`  
- Details: `html_url`, `forks_count`, `watchers_count`, `pushed_at`, `updated_at`
- Optional: `license.spdx_id`, `topics`

**Benefits:**
- 🚀 **~80% smaller files** - Faster downloads and parsing
- ⚡ **Reduced bandwidth** - Less data transfer
- 📱 **Better mobile performance** - Smaller payloads
- 🔋 **Lower resource usage** - Less memory consumption

## Usage

### Basic Usage

```yaml
- name: Fetch Repository Catalogue Data
  uses: azerothcore/git-catalogue/.github/actions/fetch-repositories@master
  with:
    organizations: '["azerothcore"]'
    topics: '{"azerothcore": ["azerothcore-module", "azerothcore-tools"]}'
    output-path: 'data/catalogue.json'
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Usage

```yaml
- name: Fetch Repository Catalogue Data
  uses: azerothcore/git-catalogue/.github/actions/fetch-repositories@master
  with:
    organizations: '["azerothcore", "other-org"]'
    topics: >-
      {
        "azerothcore": ["azerothcore-module", "azerothcore-tools", "azerothcore-lua"],
        "other-org": ["plugin", "addon"]
      }
    output-path: 'custom/path/repos.json'
    per-page: '50'
    max-retries: '5'
    rate-limit-delay: '3'
    token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `organizations` | JSON array of GitHub organizations to fetch from | Yes | `["azerothcore"]` |
| `topics` | JSON object mapping organizations to their topics | Yes | `{"azerothcore": [...]}` |
| `global-search` | Search globally across GitHub (true) or restrict to organizations (false) | No | `true` |
| `output-path` | Path where the generated JSON file will be saved | Yes | `data/catalogue.json` |
| `per-page` | Number of results per GitHub API page (max 100) | No | `100` |
| `max-retries` | Maximum retry attempts for failed requests | No | `3` |
| `rate-limit-delay` | Delay in seconds between API requests | No | `1` |
| `token` | GitHub token for API authentication | Yes | - |

## Outputs

| Output | Description |
|--------|-------------|
| `total-repos` | Total number of repositories fetched |
| `output-file` | Path to the generated JSON file |

## Generated JSON Structure

The action generates a JSON file with the following optimized structure. The `generated_at` timestamp is intentionally omitted to keep the output deterministic and avoid noisy diffs in CI and PRs.

```json
{
  "global_search": true,
  "organizations": {
    "azerothcore": {
      "azerothcore-module": [
        {
          "id": 123456,
          "name": "repo-name",
          "full_name": "azerothcore/repo-name",
          "description": "Repository description",
          "stargazers_count": 42,
          "created_at": "2023-01-15T10:30:00Z",
          "default_branch": "master",
          "owner": {
            "login": "azerothcore",
            "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
            "html_url": "https://github.com/azerothcore"
          },
          "html_url": "https://github.com/azerothcore/repo-name",
          "forks_count": 10,
          "watchers_count": 25,
          "subscribers_count": 25,
          "pushed_at": "2025-08-20T15:45:00Z",
          "updated_at": "2025-08-20T15:45:00Z",
          "license": {
            "spdx_id": "AGPL-3.0"
          },
          "topics": ["azerothcore-module"]
        }
      ]
    }
  }
}
```

**Note:** Only fields actually used by the catalogue interface are included, resulting in ~80% smaller files compared to full GitHub API responses.

## Rate Limiting

The action includes built-in protection against GitHub API rate limits:

- **Automatic detection**: Detects when rate limits are hit
- **Automatic waiting**: Waits for rate limit reset
- **Configurable delays**: Add delays between requests
- **Exponential backoff**: Retry failed requests with increasing delays

## Error Handling

- **Partial failures**: If one topic fails, others continue processing
- **Empty results**: Gracefully handles topics with no repositories
- **Network issues**: Retries network failures automatically
- **Invalid JSON**: Validates input JSON parameters

## Performance Tips

1. **Reduce API calls**: Use higher `per-page` values (up to 100)
2. **Manage rate limits**: Increase `rate-limit-delay` for heavy usage
3. **Optimize topics**: Be specific with topic names to reduce results
4. **Schedule wisely**: Don't run too frequently to avoid rate limits

## Examples

### Global Search (Default - searches entire GitHub)
```yaml
organizations: '["azerothcore"]'
topics: '{"azerothcore": ["azerothcore-module"]}'
global-search: 'true'  # This finds ALL repositories with 'azerothcore-module' topic across GitHub
```

### Organization-Specific Search
```yaml
organizations: '["azerothcore"]'
topics: '{"azerothcore": ["azerothcore-module"]}'
global-search: 'false'  # This finds repositories ONLY in the 'azerothcore' organization
```

### Multiple Organizations
```yaml
organizations: '["azerothcore", "trinitycore"]'
topics: '{"azerothcore": ["azerothcore-module"], "trinitycore": ["trinitycore-module"]}'
global-search: 'false'
```

### Complex Topic Combinations
```yaml
topics: '{"azerothcore": ["azerothcore-module+azerothcore-lua", "azerothcore-tools"]}'
global-search: 'true'  # Finds repositories with these topics across all of GitHub
```

This allows for GitHub's complex topic search syntax including combinations with `+` operator.
