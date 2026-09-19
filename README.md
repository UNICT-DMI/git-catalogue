# Git Catalogue

This is a generic project which allow to create a catalogue for your GitHub organization using the GitHub API.

Example:

- https://www.azerothcore.org/catalogue.html (the default version of the catalogue)
- https://unict-dmi.github.io/git-catalogue/#/home (fork by another open-source community)

## Features

- **Dual Data Source Mode**: Switch between real-time GitHub API calls and pre-generated static files
- **Local Configuration**: Easy setup without modifying tracked files
- **Automatic Caching**: Local storage caching to reduce API calls
- **GitHub Actions Integration**: Automated repository data generation and deployment
- **Configurable Topics**: Support for multiple organizations and topic filtering
- **Performance Optimized**: Reduce API rate limits with pre-generated data

## Quick Setup

1. **Clone the repository**
2. **Configure for your organization:**
   ```bash
   cp src/assets/config.default.json src/assets/config.json
   ```
3. **Edit `src/assets/config.json`** with your organization settings:
   ```json
   {
     "preGeneratedFileUrl": "https://your-org.github.io/data/catalogue.json",
     "tabs": {
       "All Modules": {
         "topic": "your-project-module",
         "org": "your-org",
         "path": "/module"
       }
     }
   }
   ```
4. **Install and run:**
   ```bash
   npm install
   NODE_OPTIONS="--openssl-legacy-provider" npm run start
   ```

> 📝 **Note**: The `config.json` file is git-ignored, so your local configuration won't conflict with upstream updates.

## Development

This project is written with the Angular framework, to run it locally you can run:

```bash
npm install
NODE_OPTIONS="--openssl-legacy-provider" npm run start
```

It should work smootly using:

```
node v14.15.1
npm 6.14.8
```

## Data Source Configuration

The catalogue supports two data source modes:

### 1. Real-time GitHub API (Default for Development)
- Fetches repository data directly from GitHub API
- Real-time updates but subject to API rate limits
- Configure in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  usePreGeneratedFile: false
};
```

### 2. Pre-generated File (Default for Production)
- Uses periodically updated static JSON file
- Better performance and no API rate limits
- Configure in `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  usePreGeneratedFile: true
};
```

You can also configure the data source in your local configuration file (`src/assets/config.json`):
```json
{
  "usePreGeneratedFile": true,
  "preGeneratedFileUrl": "https://<your-org>.github.io/data/catalogue.json"
}
```

## Configuration Files

This project uses a configuration system that prevents conflicts with upstream updates:

- **`src/assets/config.default.json`** (tracked) - Default configuration
- **`src/assets/config.json`** (git-ignored) - Your local configuration
- **`src/assets/config.example.json`** (tracked) - Template for local configuration

### How it works:
1. The app first tries to load `config.json` (your local config)
2. If not found, falls back to `config.default.json`
3. Your local `config.json` is never committed, avoiding merge conflicts

### Setting up your configuration:
```bash
cp src/assets/config.example.json src/assets/config.json
# Edit config.json with your settings
```

## GitHub Actions Setup

### In your website repository

Add the workflow `.github/workflows/update-catalogue-data.yml` to automatically update repository data:

```yaml
name: Update Repository Catalogue Data
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

jobs:
  update-catalogue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: <your-org>/git-catalogue/.github/actions/fetch-repositories@master
        with:
          organizations: '["<your-org>"]'
          topics: '{"<your-org>": ["module", "tools"]}'
          output-path: 'data/catalogue.json'
          token: ${{ secrets.GITHUB_TOKEN }}
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/catalogue.json
          git commit -m "Update catalogue data" || exit 0
          git push
```

## Usage

1. **Runtime Switching**: Users can toggle between data sources in the "How to" page
2. **Environment-based**: Set `usePreGeneratedFile` in environment files
3. **Config-based**: Configure in `default.json` for runtime flexibility

Feel free to use it and create your fork, don't forget to create a PR about it.

### TODO

- make it more customizable, let any developer to change some specific page content without creating any git conflict
- ✅ add github action to verify the build (added comprehensive GitHub Actions)
- upgrade to last angular version and make this project compatible with node20

### Credits

- [Deku](https://github.com/deku) (original author of the [previous implementation](https://github.com/azerothcore/catalogue))
- [Helias](https://github.com/Helias) (author and mantainer of the current catalogue version, contact me on Discord!)
