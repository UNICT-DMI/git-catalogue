import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, reduce, tap } from 'rxjs/operators';
import { RepositoriesPage, Repository } from 'src/@types';
import { Config, Tab } from './catalogue.model';
import { APP_CONFIG } from '../config/config.token';

@Injectable({
  providedIn: 'root',
})
export class CatalogueService {
  CONF: Config;
  items$: Record<string, Observable<Repository[]>> = {};
  private preGeneratedData: any | null = null;
  private preGenIndexById: Map<number, Repository> | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    @Inject(APP_CONFIG) conf: Config
  ) {
    this.CONF = conf;
    // Initialize items immediately; config is preloaded during APP_INITIALIZER
    for (const k of Object.keys(this.CONF.tabs)) {
      this.items$[k] = this.getLocalItems(this.CONF.tabs[k]);
    }
  }

  private getLocalItems(tab: Tab): Observable<Repository[]> {
    const { org = 'default-org', topic = '' } = tab;
    const key = `${org}-${topic}`;
    const item = localStorage.getItem(key);

    if (item && !this.expireMinutes(30, JSON.parse(item).timeDate)) {
      return of(JSON.parse(item).value);
    }

    // Check if we should use pre-generated file
    if (this.CONF?.usePreGeneratedFile) {
      return this.getItemsFromPreGeneratedFile(org, topic, key);
    }

    // Use original API method
    return this.getItemsFromAPI(org, topic, key);
  }

  private getItemsFromPreGeneratedFile(org: string, topic: string, key: string): Observable<Repository[]> {
    const fileUrl = this.CONF.preGeneratedFileUrl || 'data/catalogue.json';

    return this.http.get<any>(fileUrl).pipe(
      map(data => {
        // Navigate the JSON structure: organizations -> org -> topic
        if (data.organizations && data.organizations[org] && data.organizations[org][topic]) {
          return data.organizations[org][topic];
        }
        return [];
      }),
      tap(repos => this.cacheRepos(key, repos)),
      catchError(error => {
        console.warn('Failed to fetch from pre-generated file, falling back to API', error);
        return this.getItemsFromAPI(org, topic, key);
      })
    );
  }

  private getItemsFromAPI(org: string, topic: string, key: string): Observable<Repository[]> {
    const topicFilter = topic ? `+topic:${topic}` : '';

    // Check if this tab should use global search
    const tab = Object.values(this.CONF.tabs).find(t => t.org === org && t.topic === topic);
    const useGlobalSearch = tab?.globalSearch ?? this.CONF.globalSearch ?? false;

    // Only include org filter if not using global search
    const orgFilter = useGlobalSearch ? '' : (org ? `org:${org}+` : '');

    const perPage = this.CONF.perPage;
    let totalSize = null;

    const getPage = (page: number) => {
      return this.http.get<RepositoriesPage>(
        `https://api.github.com/search/repositories?page=${page}&per_page=${this.CONF.perPage}&q=${orgFilter}fork:true${topicFilter}+sort:stars`,
      );
    };

    const pages$ = new Observable<Repository[]>((observer) => {
      const fetchPage = (page) =>
        getPage(page)
          .pipe(
            map((res) => {
              if (!totalSize) {
                totalSize = res.total_count;
              }
              return res.items;
            }),
          )
          .subscribe((items) => {
            observer.next(items);
            const hasNextPage = perPage * page < totalSize;
            if (hasNextPage) {
              fetchPage(page + 1);
            } else {
              observer.complete();
            }
          });

      fetchPage(1);
    }).pipe(reduce((acc, val) => acc.concat(val), []));

    return this.cacheable(pages$, key);
  }

  private cacheRepos(key: string, repos: Repository[]) {
    localStorage.setItem(key, JSON.stringify({ timeDate: new Date().getTime(), value: repos }));
  }

  cacheable<T extends Repository | Repository[]>(obs: Observable<T>, key: string): Observable<T> {
    return obs.pipe(
      tap({
        next: (data: T) => {
          localStorage.setItem(key, JSON.stringify({ timeDate: new Date().getTime(), value: data }));
        },
        error: (err) => {
          console.error(err);
        },
      }),
    );
  }

  private expireMinutes(minutes: number, timeDate: number): boolean {
    const diff = Math.abs(new Date().getTime() - timeDate);
    const diffMinutes = Math.floor(diff / 1000) / 60;
    return minutes < diffMinutes;
  }

  getLocalRepo(id: number): Observable<Repository> {
    const key = 'repo-' + id;

    const item = localStorage.getItem(key);
    if (item && !this.expireMinutes(30, JSON.parse(item).timeDate)) {
      return of(JSON.parse(item).value);
    }

    // If using the pre-generated file, try to resolve from there instead of GitHub API
    if (this.isUsingPreGeneratedFile()) {
      // 1) Try to find the repo in cached tab lists first (fast path)
      const cachedRepo = this.findRepoInTabCaches(id);
      if (cachedRepo) {
        const normalized = this.normalizeRepo(cachedRepo);
        localStorage.setItem(key, JSON.stringify({ timeDate: new Date().getTime(), value: normalized }));
        return of(normalized);
      }

      // 2) Load pre-generated data and search globally
      return this.loadPreGeneratedData().pipe(
        map(() => {
          const repo = this.findRepoInPreGenIndex(id);
          if (!repo) {
            throw new Error('Repo not found in pre-generated data');
          }
          const normalized = this.normalizeRepo(repo);
          localStorage.setItem(key, JSON.stringify({ timeDate: new Date().getTime(), value: normalized }));
          return normalized;
        }),
        // If anything fails, fall back to API
        catchError(() => this.http.get<Repository>(`https://api.github.com/repositories/${id}`)),
        tap((repo) => localStorage.setItem(key, JSON.stringify({ timeDate: new Date().getTime(), value: repo })))
      );
    }

    // Default: use GitHub API
    return this.cacheable(this.http.get<Repository>(`https://api.github.com/repositories/${id}`), key);
  }

  get confTabsKeys(): string[] {
    return this.CONF ? Object.keys(this.CONF.tabs) : [];
  }

  get confTabPaths(): string[] {
    return this.CONF ? Object.values(this.CONF.tabs).map((tab) => tab.path) : [];
  }

  get tabIndex(): number {
    if (!this.confTabPaths) {
      return -1;
    }

    const tabName = this.route.snapshot.paramMap.get('tab');
    return tabName ? this.confTabPaths.indexOf(`/${tabName}`) : 0;
  }

  getRawReadmeDefault(repo: Repository): Observable<string> {
    return this.getRawReadme(repo.full_name, repo.default_branch);
  }

  getRawReadme(repo: string, defaultBranch: string): Observable<string> {
    return this.http
      .get(`https://raw.githubusercontent.com/${repo}/${defaultBranch}/README.md?time=${Date.now()}`, {
        responseType: 'text',
      })
      .pipe(
        catchError(() =>
          this.http
            .get(`https://raw.githubusercontent.com/${repo}/${defaultBranch}/.github/README.md?time=${Date.now()}`, {
              responseType: 'text',
            })
            .pipe(catchError(() => of('No README found'))),
        ),
      );
  }

  // New methods for managing data source mode
  toggleDataSource(): void {
    if (this.CONF) {
      this.CONF.usePreGeneratedFile = !this.CONF.usePreGeneratedFile;
      this.clearCache();
      this.refreshItems();
    }
  }

  setDataSource(usePreGeneratedFile: boolean): void {
    if (this.CONF) {
      this.CONF.usePreGeneratedFile = usePreGeneratedFile;
      this.clearCache();
      this.refreshItems();
    }
  }

  isUsingPreGeneratedFile(): boolean {
    return this.CONF?.usePreGeneratedFile || false;
  }

  private clearCache(): void {
    for (const tabKey of Object.keys(this.CONF.tabs)) {
      const tab = this.CONF.tabs[tabKey];
      const { org = 'default-org', topic = '' } = tab;
      const key = `${org}-${topic}`;
      localStorage.removeItem(key);
    }
  }

  private refreshItems(): void {
    for (const k of Object.keys(this.CONF.tabs)) {
      this.items$[k] = this.getLocalItems(this.CONF.tabs[k]);
    }
  }

  // Pre-generated data helpers
  private loadPreGeneratedData(): Observable<any> {
    if (this.preGeneratedData && this.preGenIndexById) {
      return of(this.preGeneratedData);
    }
    const fileUrl = this.CONF?.preGeneratedFileUrl || 'data/catalogue.json';
    return this.http.get<any>(fileUrl).pipe(
      tap((data) => {
        this.preGeneratedData = data;
        this.buildPreGenIndex(data);
      })
    );
  }

  private buildPreGenIndex(data: any): void {
    this.preGenIndexById = new Map<number, Repository>();
    if (!data || !data.organizations) {
      return;
    }
    const orgs = data.organizations;
    for (const orgKey of Object.keys(orgs)) {
      const topics = orgs[orgKey];
      for (const topicKey of Object.keys(topics || {})) {
        const repos: Repository[] = topics[topicKey] || [];
        for (const repo of repos) {
          if (repo && typeof repo.id === 'number') {
            this.preGenIndexById.set(repo.id, repo);
          }
        }
      }
    }
  }

  private findRepoInPreGenIndex(id: number): Repository | null {
    if (!this.preGenIndexById) {
      return null;
    }
    return this.preGenIndexById.get(id) || null;
  }

  private findRepoInTabCaches(id: number): Repository | null {
    if (!this.CONF) {
      return null;
    }
    for (const tabKey of Object.keys(this.CONF.tabs)) {
      const tab = this.CONF.tabs[tabKey];
      const { org = 'default-org', topic = '' } = tab;
      const key = `${org}-${topic}`;
      const item = localStorage.getItem(key);
      if (!item) {
        continue;
      }
      const parsed = JSON.parse(item);
      if (this.expireMinutes(30, parsed.timeDate)) {
        continue;
      }
      const repos: Repository[] = parsed.value || [];
      const match = repos.find((r) => r && r.id === Number(id));
      if (match) {
        return match;
      }
    }
    return null;
  }

  private normalizeRepo(repo: Repository): Repository {
    // Ensure essential fields exist to avoid template issues
    const safe = { ...repo } as any;
    if (!safe.owner) {
      const ownerLogin = typeof safe.full_name === 'string' && safe.full_name.includes('/')
        ? safe.full_name.split('/')[0]
        : '';
      safe.owner = { login: ownerLogin } as any;
    }
    safe.subscribers_count = typeof safe.subscribers_count === 'number' ? safe.subscribers_count : 0;
    safe.stargazers_count = typeof safe.stargazers_count === 'number' ? safe.stargazers_count : 0;
    safe.forks_count = typeof safe.forks_count === 'number' ? safe.forks_count : 0;
    safe.created_at = safe.created_at || new Date().toISOString();
    safe.pushed_at = safe.pushed_at || safe.updated_at || new Date().toISOString();
    safe.default_branch = safe.default_branch || 'master';
    return safe as Repository;
  }
}
