import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RepoDetailsComponent } from './repo-details.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RepoDetailsComponent', () => {
  let component: RepoDetailsComponent;
  let fixture: ComponentFixture<RepoDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [RepoDetailsComponent],
    imports: [RouterTestingModule, FontAwesomeModule],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();
  });

  beforeEach(() => {
    sessionStorage.clear();
    fixture = TestBed.createComponent(RepoDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the stored catalogue route for the back link', () => {
    sessionStorage.setItem('azerothcore.catalogue.returnHash', '#/tab/modules');

    const restoredFixture = TestBed.createComponent(RepoDetailsComponent);

    expect(restoredFixture.componentInstance.returnHash).toBe('#/tab/modules');
    restoredFixture.destroy();
  });

  it('should fall back to the catalogue home for invalid return routes', () => {
    sessionStorage.setItem('azerothcore.catalogue.returnHash', 'https://example.com');

    const restoredFixture = TestBed.createComponent(RepoDetailsComponent);

    expect(restoredFixture.componentInstance.returnHash).toBe('#/home');
    restoredFixture.destroy();
  });
});
