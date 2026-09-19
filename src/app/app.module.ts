import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppComponent } from './app.component';
import { RepoComponent } from './repo/repo.component';
import { MomentModule } from 'ngx-moment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
import { AppConfigService } from './services/config/app-config.service';
import { APP_CONFIG } from './services/config/config.token';

export function initAppConfig(configService: AppConfigService) {
  // Angular 11 APP_INITIALIZER waits for Promise (not Observable)
  return () => configService.load().toPromise();
}

export function provideConfig(configService: AppConfigService) {
  return configService.getConfig();
}

@NgModule({ declarations: [AppComponent, RepoComponent, RepoDetailsComponent, HomeComponent, HowtoComponent, CatalogueComponent, EmojiFixupPipe],
    bootstrap: [AppComponent], imports: [FormsModule,
        BrowserModule,
        AppRoutingModule,
        FontAwesomeModule,
        MomentModule,
        BrowserAnimationsModule,
        MatPaginatorModule,
        MatTabsModule,
        MarkdownModule.forRoot()], providers: [
        AppConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: initAppConfig,
            deps: [AppConfigService],
            multi: true
        },
        {
            provide: APP_CONFIG,
            useFactory: provideConfig,
            deps: [AppConfigService]
        },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {}
