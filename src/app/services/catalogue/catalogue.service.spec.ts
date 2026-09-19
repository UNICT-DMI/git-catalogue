import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CatalogueService } from './catalogue.service';
import { APP_CONFIG } from '../config/config.token';
import { Config } from './catalogue.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import { Repository } from 'src/@types';

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

  describe('when localStorage is full', () => {
    const repos = [{ id: 1, name: 'repo' }] as Repository[];
    const setItem = Storage.prototype.setItem;

    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it('should free the catalogue cache and retry', () => {
      localStorage.setItem('repo-42', '{}');
      localStorage.setItem('other-site', 'keep');
      let fail = true;
      spyOn(Storage.prototype, 'setItem').and.callFake(function (this: Storage, key: string, value: string) {
        if (fail) {
          fail = false;
          throw new DOMException('quota', 'QuotaExceededError');
        }
        setItem.call(this, key, value);
      });

      let result: Repository[];
      service.cacheable(of(repos), 'tab').subscribe((data) => (result = data));

      expect(result).toEqual(repos);
      expect(localStorage.getItem('repo-42')).toBeNull();
      expect(localStorage.getItem('other-site')).toBe('keep');
      expect(JSON.parse(localStorage.getItem('tab')).value).toEqual(repos);
    });

    it('should still emit the data when caching keeps failing', () => {
      spyOn(Storage.prototype, 'setItem').and.throwError(new DOMException('quota', 'QuotaExceededError'));
      spyOn(console, 'warn');

      let result: Repository[];
      service.cacheable(of(repos), 'tab').subscribe((data) => (result = data));

      expect(result).toEqual(repos);
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
