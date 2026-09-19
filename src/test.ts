// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { APP_CONFIG } from './app/services/config/config.token';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);

// Provide a default APP_CONFIG for tests that don't declare it explicitly
getTestBed().configureTestingModule({
  providers: [
    {
      provide: APP_CONFIG,
      useValue: {
        page: 0,
        perPage: 10,
        pageSize: 8,
        globalSearch: true,
        tabs: { Test: { topic: '', org: '', path: '/test', globalSearch: true } },
        usePreGeneratedFile: false,
      },
    },
  ],
});
