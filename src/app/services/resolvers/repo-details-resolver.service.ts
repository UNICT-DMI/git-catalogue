import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Repository } from 'src/@types';
import { CatalogueService } from '../catalogue/catalogue.service';

export type RepoDetailsData = {
  repo: Repository;
  readme: string
}

@Injectable({
  providedIn: 'root'
})
export class RepoDetailsResolverService implements Resolve<RepoDetailsData> {

  constructor( private svc: CatalogueService ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): RepoDetailsData | Observable<RepoDetailsData> | Promise<RepoDetailsData> {
    const id = route.params.id;

    const repo$ = this.svc.getLocalRepo(id);
    
    return repo$.pipe(
      switchMap( (repo) => forkJoin({
        repo: of(repo),
        readme: this.svc.getRawReadmeDefault(repo)
      }))
    );
  }
}
