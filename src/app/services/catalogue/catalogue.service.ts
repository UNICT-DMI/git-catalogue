import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, reduce, tap } from 'rxjs/operators';
import { RepositoriesPage, Repository } from 'src/@types';
import { Config, Tab } from './catalogue.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogueService {
  CONF: Config;
  items$: Record<string, Observable<Repository[]>> = {};

  private configURL = 'assets/default.json';

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.http.get<Config>(this.configURL).subscribe((config: Config) => {
      this.CONF = config;

      for (const k of Object.keys(this.CONF.tabs)) {
        this.items$[k] = this.getLocalItems(this.CONF.tabs[k]);
      }
    });
  }

  private getLocalItems(tab: Tab): Observable<Repository[]> {
    const { org = '', topic = '' } = tab;
    const key = `${org}-${topic}`;
    const item = localStorage.getItem(key);

    if (item && !this.expireMinutes(30, JSON.parse(item).timeDate)) {
      return of(JSON.parse(item).value);
    }

    const topicFilter = topic ? `+topic:${topic}` : '';
    const orgFilter = org ? `org:${org}+` : '';

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

    return this.cacheable(this.http.get<Repository>(`https://api.github.com/repositories/${id}`), key);
  }

  get confTabsKeys(): string[] {
    return this.CONF && Object.keys(this.CONF?.tabs);
  }

  get confTabPaths(): string[] {
    return this.CONF && Object.values(this.CONF.tabs).map((tab) => tab.path);
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
}
