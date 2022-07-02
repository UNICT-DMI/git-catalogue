import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBalanceScale,
  faCaretLeft,
  faClock,
  faCodeBranch,
  faExternalLinkAlt,
  faEye,
  faGlobe,
  faStar,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Observable, of, forkJoin, ReplaySubject, Subscription } from 'rxjs';
import { pluck, switchMap } from 'rxjs/operators';

import { Repository } from 'src/@types';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { RepoDetailsData } from '../services/resolvers/repo-details-resolver.service';

@Component({
  selector: 'app-repo-details',
  templateUrl: './repo-details.component.html',
  styleUrls: ['./repo-details.component.scss'],
})
export class RepoDetailsComponent implements OnInit{
  constructor(private route: ActivatedRoute) {
    this.data$ = route.data.pipe(
      pluck('data')
    );
  }

  readonly faCaretLeft = faCaretLeft;
  readonly faGlobe = faGlobe;
  readonly faUserCircle = faUserCircle;
  readonly faGithub = faGithub;
  readonly faExternalLinkAlt = faExternalLinkAlt;
  readonly faEye = faEye;
  readonly faStar = faStar;
  readonly faCodeBranch = faCodeBranch;
  readonly faClock = faClock;
  readonly faBalanceScale = faBalanceScale;

  data$: Observable<RepoDetailsData>;



  ngOnInit(): void {
    
  }

  
}
