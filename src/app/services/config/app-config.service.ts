import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, concat, defer, throwError } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { Config } from '../catalogue/catalogue.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: Config | null = null;
  private readonly configURLs = ['assets/config.json', 'assets/config.default.json'];

  constructor(private http: HttpClient) {}

  load(): Observable<void> {
    const attempts = this.configURLs.map((url) =>
      this.http.get<Config>(url).pipe(
        take(1),
        map((cfg) => this.applyEnvironmentOverrides(cfg)),
        tap((cfg) => (this.config = cfg)),
        map(() => void 0),
        catchError((err) => {
          if (err?.status === 404) {
            return EMPTY; // try next URL
          }
          return throwError(err);
        }),
      ),
    );

    return concat(
      ...attempts,
      defer(() => throwError(new Error('No configuration file found (assets/config.json or assets/config.default.json)'))),
    ).pipe(take(1));
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('AppConfigService.getConfig() called before configuration was loaded');
    }
    return this.config;
  }

  private applyEnvironmentOverrides(cfg: Config): Config {
    const merged = { ...cfg };

    return merged;
  }
}
