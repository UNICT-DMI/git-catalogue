import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Repository } from 'src/@types';
import { Config, Tab } from './catalogue.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogueService {
  CONF: Config;
  items$: Record<string, Observable<Repository>> = {};
  isLoading: boolean = true;

  private configURL = 'assets/default.json';

  constructor(private http: HttpClient) {
    this.http.get<Config>(this.configURL).subscribe((config: Config) => {
      this.CONF = config;

      for (const k of Object.keys(this.CONF.tabs)) {
        this.items$[k] = this.getLocalItems(this.CONF.tabs[k]);
      }
      this.isLoading = false;
    });
  }

  private getLocalItems(tab: Tab): Observable<Repository> {
    const { org = '', topic = '' } = tab;
    const key = `${this.CONF.page}-${this.CONF.perPage}-${org}-${topic}`;
    const item = localStorage.getItem(key);

    if (item && !this.expireMinutes(30, JSON.parse(item).timeDate)) {
      return of(JSON.parse(item).value);
    }

    const topicFilter = topic ? `+topic:${topic}` : '';
    const orgFilter = org ? `org:${org}+` : '';

    return this.getFromAPI(
      `https://api.github.com/search/repositories?page=${this.CONF.page}&per_page=${this.CONF.perPage}&q=${orgFilter}fork:true${topicFilter}+sort:stars`,
      key,
    );
  }

  getFromAPI(URL: string, key: string): Observable<Repository> {
    return this.http.get(URL).pipe(
      tap({
        next: (data: Repository) => {
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

    return this.getFromAPI(`https://api.github.com/repositories/${id}`, key);
  }

  get confTabsKeys(): string[] {
    return this.CONF && Object.keys(this.CONF?.tabs);
  }

  get confTabPaths(): string[] {
    return this.CONF && Object.values(this.CONF.tabs).map((tab) => tab.path);
  }

  getRawReadmeDefault( repo: Repository ): Observable<string> {
    return this.getRawReadme( repo.full_name, repo.default_branch );
  }
  
  getRawReadme(repo: string, default_branch: string): Observable<string> {
    return this.http.get(`https://raw.githubusercontent.com/${repo}/${default_branch}/README.md`, { responseType: 'text' });
  }
}
