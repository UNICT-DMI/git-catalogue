import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { APP_CONFIG } from '../services/config/config.token';
import { Config } from '../services/catalogue/catalogue.model';

import { HowtoComponent } from './howto.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HowtoComponent', () => {
  let component: HowtoComponent;
  let fixture: ComponentFixture<HowtoComponent>;

  beforeEach(async () => {
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
    await TestBed.configureTestingModule({
    declarations: [HowtoComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [RouterTestingModule,
        FontAwesomeModule],
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
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HowtoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
