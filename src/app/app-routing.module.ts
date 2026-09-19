import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { HowtoComponent } from './howto/howto.component';
import { RepoDetailsComponent } from './repo-details/repo-details.component';
import { RepoDetailsResolverService } from './services/resolvers/repo-details-resolver.service';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'tab/:tab', component: HomeComponent },
  {
    path: 'details/:id',
    component: RepoDetailsComponent,
    resolve: { data: RepoDetailsResolverService },
    runGuardsAndResolvers: 'paramsChange',
  },
  { path: 'how-to', component: HowtoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
