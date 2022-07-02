import { TestBed } from '@angular/core/testing';

import { RepoDetailsResolverService } from './repo-details-resolver.service';

describe('RepoDetailsResolverService', () => {
  let service: RepoDetailsResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RepoDetailsResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
