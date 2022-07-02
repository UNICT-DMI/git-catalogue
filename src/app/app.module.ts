import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppComponent } from './app.component';
import { RepoComponent } from './repo/repo.component';
import { MomentModule } from 'angular2-moment';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { RepoDetailsComponent } from './repo-details/repo-details.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';
import { HowtoComponent } from './howto/howto.component';
import { MarkdownModule } from 'ngx-markdown';
import { CatalogueComponent } from './catalogue/catalogue.component';
import { EmojiFixupPipe } from './pipes/emoji-fixup.pipe';

@NgModule({
  declarations: [AppComponent, RepoComponent, RepoDetailsComponent, HomeComponent, HowtoComponent, CatalogueComponent, EmojiFixupPipe],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    MomentModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatPaginatorModule,
    MatTabsModule,
    MarkdownModule.forRoot(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
