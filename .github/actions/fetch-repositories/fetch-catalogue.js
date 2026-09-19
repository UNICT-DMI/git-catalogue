const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * CatalogueFetcher - Optimized GitHub Repository Fetcher
 * 
 * This class fetches repository data from GitHub's Search API and generates
 * a JSON file containing only the fields actually used by the git-catalogue UI.
 * 
 * Optimization: Instead of returning 100+ fields per repository, we only include
 * the ~20 fields that are actually displayed in the catalogue interface, reducing
 * file size by approximately 80% and improving load times.
 * 
 * Fields included:
 * - Core: id, name, full_name, description, stargazers_count, created_at, default_branch
 * - Owner: login, avatar_url, html_url
 * - Details: html_url, forks_count, watchers_count, pushed_at, updated_at
 * - Optional: license.spdx_id, topics
 */

class CatalogueFetcher {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.organizations = JSON.parse(process.env.ORGANIZATIONS || '["default-org"]');
    this.topics = JSON.parse(process.env.TOPICS || '{}');
    this.globalSearch = process.env.GLOBAL_SEARCH === 'true';
    this.outputPath = process.env.OUTPUT_PATH || 'data/catalogue.json';
    this.perPage = parseInt(process.env.PER_PAGE) || 100;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.rateLimit = parseInt(process.env.RATE_LIMIT_DELAY) || 1;
    this.totalRepos = 0;
  }

  // Normalize a single repo entry to a consistent property order and stable nested arrays
  normalizeRepoEntry(repo) {
    const owner = repo.owner || {};
    const license = repo.license ? { spdx_id: repo.license.spdx_id } : null;
    const topics = Array.isArray(repo.topics) ? [...repo.topics].sort((a, b) => a.localeCompare(b)) : [];
    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      stargazers_count: repo.stargazers_count,
      created_at: repo.created_at,
      default_branch: repo.default_branch,
      owner: {
        login: owner.login,
        avatar_url: owner.avatar_url,
        html_url: owner.html_url
      },
      html_url: repo.html_url,
      forks_count: repo.forks_count,
      watchers_count: repo.watchers_count,
      subscribers_count: repo.subscribers_count,
      pushed_at: repo.pushed_at,
      updated_at: repo.updated_at,
      license: license,
      topics
    };
  }

  // Normalize an array of repositories for stable ordering
  normalizeRepositories(repositories) {
    const toTime = (v) => {
      if (!v) return 0;
      try {
        return (v instanceof Date) ? v.getTime() : new Date(v).getTime();
      } catch (_) {
        return 0;
      }
    };

    return [...repositories].sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      const bt = toTime(b.pushed_at);
      const at = toTime(a.pushed_at);
      if (bt !== at) {
        return bt - at;
      }
      const af = (a.full_name || '').toLowerCase();
      const bf = (b.full_name || '').toLowerCase();
      if (af < bf) return -1;
      if (af > bf) return 1;
      return 0;
    });
  }

  // Build a normalized catalogue object with deterministic key and array order.
  // Note: intentionally no generated_at field to avoid false diffs.
  buildNormalizedCatalogue(raw) {
    const normalized = {
      global_search: !!raw.global_search,
      organizations: {}
    };

    const orgKeys = Object.keys(raw.organizations || {}).sort((a, b) => a.localeCompare(b));
    for (const org of orgKeys) {
      const topics = raw.organizations[org] || {};
      const topicKeys = Object.keys(topics).sort((a, b) => a.localeCompare(b));
      normalized.organizations[org] = {};
      for (const topic of topicKeys) {
        const repos = Array.isArray(topics[topic]) ? topics[topic] : [];
        const sortedRepos = this.normalizeRepositories(repos).map(r => this.normalizeRepoEntry(r));
        normalized.organizations[org][topic] = sortedRepos;
      }
    }

    return normalized;
  }

  async delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  async fetchWithRetry(url, options = {}, retries = 0) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'Git-Catalogue-Action',
          'Accept': 'application/vnd.github.v3+json',
          ...options.headers
        }
      });

      // Handle rate limiting
      if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
        const resetTime = parseInt(response.headers.get('x-ratelimit-reset')) * 1000;
        const waitTime = Math.max(resetTime - Date.now(), 0) + 1000;
        console.log(`Rate limit hit. Waiting ${waitTime/1000} seconds...`);
        await this.delay(waitTime / 1000);
        return this.fetchWithRetry(url, options, retries);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Request failed, retrying... (${retries + 1}/${this.maxRetries})`);
        await this.delay(Math.pow(2, retries)); // Exponential backoff
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  async fetchRepositoriesForTopic(org, topic) {
    const repositories = [];
    let page = 1;
    let hasMore = true;

    console.log(`Fetching repositories for ${this.globalSearch ? 'global' : org}/${topic}...`);

    while (hasMore) {
      // Build query with proper GitHub search syntax (spaces, not +)
      let query = '';
      if (!this.globalSearch && org) {
        query += `org:${org} `;
      }
      // For global search, omit fork:true to include all repos with topic
      if (!this.globalSearch) {
        query += 'fork:true ';
      }
      if (topic) {
        // Handle compound topics like "azerothcore-module+azerothcore-lua"
        if (topic.includes('+')) {
          const topics = topic.split('+');
          topics.forEach(t => {
            query += `topic:${t.trim()} `;
          });
        } else {
          query += `topic:${topic} `;
        }
      }
      query = query.trim();
      
      const url = `https://api.github.com/search/repositories?page=${page}&per_page=${this.perPage}&q=${encodeURIComponent(query)}&sort=stars&order=desc`;
      
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        // Process repositories with only the fields actually used by the catalogue
        const processedRepos = data.items.map(repo => ({
          // Core fields used in list view
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          stargazers_count: repo.stargazers_count,
          created_at: new Date(repo.created_at),
          default_branch: repo.default_branch,
          
          // Owner fields (used for avatar and profile links)
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
            html_url: repo.owner.html_url
          },
          
          // Additional fields used in details view
          html_url: repo.html_url,
          forks_count: repo.forks_count,
          watchers_count: repo.watchers_count,
          subscribers_count: repo.subscribers_count, // Sometimes used instead of watchers_count
          pushed_at: new Date(repo.pushed_at),
          updated_at: new Date(repo.updated_at),
          
          // Optional fields
          license: repo.license ? {
            spdx_id: repo.license.spdx_id
          } : null,
          
          // Topics (useful for filtering/debugging)
          topics: repo.topics || []
        }));

        repositories.push(...processedRepos);
        
        if (data.items.length < this.perPage) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }

      // Rate limiting
      await this.delay(this.rateLimit);
    }

    console.log(`Found ${repositories.length} repositories for ${org}/${topic}`);
    return repositories;
  }

  async fetchAllRepositories() {
    const catalogueData = {
      global_search: this.globalSearch,
      organizations: {}
    };

    if (this.globalSearch) {
      // For global search, organize by topics globally but maintain org structure for compatibility
      const allTopics = new Set();
      Object.values(this.topics).forEach(topics => topics.forEach(topic => allTopics.add(topic)));
      
      // Use first organization as the key for backwards compatibility
      const primaryOrg = this.organizations[0] || 'default-org';
      catalogueData.organizations[primaryOrg] = {};
      
      for (const topic of allTopics) {
        try {
          const repositories = await this.fetchRepositoriesForTopic(primaryOrg, topic);
          catalogueData.organizations[primaryOrg][topic] = repositories;
          this.totalRepos += repositories.length;
        } catch (error) {
          console.error(`Failed to fetch global/${topic}:`, error.message);
          throw error; // Fail the workflow on any fetch error
        }
      }
    } else {
      // Original organization-specific logic
      for (const org of this.organizations) {
        catalogueData.organizations[org] = {};
        const orgTopics = this.topics[org] || [];

        for (const topic of orgTopics) {
          try {
            const repositories = await this.fetchRepositoriesForTopic(org, topic);
            catalogueData.organizations[org][topic] = repositories;
            this.totalRepos += repositories.length;
          } catch (error) {
            console.error(`Failed to fetch ${org}/${topic}:`, error.message);
            throw error; // Fail the workflow on any fetch error
          }
        }
      }
    }

    return catalogueData;
  }

  async saveCatalogue(data) {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Always write deterministically ordered content without a timestamp
    const normalized = this.buildNormalizedCatalogue(data);
    fs.writeFileSync(this.outputPath, JSON.stringify(normalized, null, 2));
    console.log(`Catalogue saved to ${this.outputPath}`);
  }

  async run() {
    try {
      console.log('Starting catalogue generation...');
      console.log(`Search Mode: ${this.globalSearch ? '🌍 Global GitHub search' : '🏢 Organization-specific search'}`);
      console.log(`Organizations: ${this.organizations.join(', ')}`);
      console.log(`Topics: ${JSON.stringify(this.topics)}`);
      console.log(`Output path: ${this.outputPath}`);
      console.log('📦 Using optimized field selection (only fields used by catalogue UI)');
      
      const catalogueData = await this.fetchAllRepositories();
      await this.saveCatalogue(catalogueData);
      
      // Calculate file size reduction info
      const fileSizeKB = Math.round(JSON.stringify(catalogueData).length / 1024);
      console.log(`✅ Generated catalogue with ${this.totalRepos} repositories`);
      console.log(`📊 Output file size: ${fileSizeKB} KB (optimized)`);
      
      // Set output for GitHub Actions
      if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `total-repos=${this.totalRepos}\n`);
      }
    } catch (error) {
      console.error('❌ Failed to generate catalogue:', error.message);
      process.exit(1);
    }
  }
}

new CatalogueFetcher().run();
