import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { APP_CONFIG } from '../config/config.token';
import { Config } from '../catalogue/catalogue.model';

import { RepoDetailsResolverService } from './repo-details-resolver.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RepoDetailsResolverService', () => {
  let service: RepoDetailsResolverService;

  beforeEach(() => {
    const MOCK_CONFIG: Config = {
      page: 0,
      perPage: 10,
      pageSize: 8,
      globalSearch: true,
      tabs: {
        Test: { topic: '', org: '', path: '/test', globalSearch: true },
      },
      usePreGeneratedFile: false,
    };
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        { provide: APP_CONFIG, useValue: MOCK_CONFIG },
        {
            provide: ActivatedRoute,
            useValue: {
                snapshot: {
                    paramMap: {
                        get: () => null
                    }
                }
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(RepoDetailsResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
