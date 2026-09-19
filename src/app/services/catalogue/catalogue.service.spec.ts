import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CatalogueService } from './catalogue.service';
import { APP_CONFIG } from '../config/config.token';
import { Config } from './catalogue.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CatalogueService', () => {
  let service: CatalogueService;

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
    service = TestBed.inject(CatalogueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
