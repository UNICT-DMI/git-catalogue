import { Location } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faSearch, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Repository } from 'src/@types';
import { CatalogueService } from '../services/catalogue/catalogue.service';

const PAGE_STORAGE_KEY = 'azerothcore.catalogue.page';
const RETURN_HASH_STORAGE_KEY = 'azerothcore.catalogue.returnHash';
const SORT_STORAGE_KEY = 'azerothcore.catalogue.sort';

export type SortKey = 'stars' | 'updated' | 'created';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'stars', label: 'Most stars' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'created', label: 'Recently added' },
];

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    providers: [CatalogueService],
    standalone: false
})
export class HomeComponent {
  constructor(public catalogueService: CatalogueService, public cdRef: ChangeDetectorRef, private location: Location) {
    window.parent.document.title = 'GitCatalogue';
    this.saveRoute();
  }

  page = this.readPage();
  sort: SortKey = this.readSort();
  search: string;
  readonly faSearch: IconDefinition = faSearch;
  readonly faTelegram: IconDefinition = faTelegram;
  readonly sortOptions = SORT_OPTIONS;

  readPage(): number {
    try {
      const page = parseInt(sessionStorage.getItem(PAGE_STORAGE_KEY) || '0', 10);
      return isNaN(page) || page < 0 ? 0 : page;
    } catch (error) {
      return 0;
    }
  }

  savePage(): void {
    try {
      sessionStorage.setItem(PAGE_STORAGE_KEY, String(this.page));
    } catch (error) {}
  }

  readSort(): SortKey {
    try {
      const sort = sessionStorage.getItem(SORT_STORAGE_KEY) as SortKey;
      return SORT_OPTIONS.some((option) => option.key === sort) ? sort : 'stars';
    } catch (error) {
      return 'stars';
    }
  }

  saveSort(): void {
    try {
      sessionStorage.setItem(SORT_STORAGE_KEY, this.sort);
    } catch (error) {}
  }

  saveRoute(path?: string): void {
    try {
      const route = path || this.location.path() || '/home';
      sessionStorage.setItem(RETURN_HASH_STORAGE_KEY, `#${route}`);
    } catch (error) {}
  }

  resetPage(): void {
    this.page = 0;
    this.savePage();
    this.saveRoute();
    this.refresh();
  }

  refresh(): void {
    this.cdRef.detectChanges();
  }

  onSearchChange(value: string): void {
    this.resetPage();
  }

  onSortChange(value: SortKey): void {
    this.saveSort();
    this.resetPage();
  }

  onPageChange(page: PageEvent): void {
    this.page = page.pageIndex;
    this.savePage();
    this.saveRoute();
  }

  onTabChange(tab: MatTabChangeEvent): void {
    const index = tab.index;
    const tabName = Object.keys(this.catalogueService.CONF.tabs)[index];
    const path = `/tab${this.catalogueService.CONF.tabs[tabName].path}`;

    this.page = 0;
    this.savePage();
    this.saveRoute(path);

    if (this.location.path() !== path) {
      this.location.go(path);
    }
  }

  currentPageItems(modules: Repository[]): Repository[] {
    const items = this.sortItems(this.matchingItems(modules));
    return items.slice(this.catalogueService.CONF.pageSize * this.page, this.catalogueService.CONF.pageSize * (this.page + 1));
  }

  filteredLength(modules: Repository[]): number {
    return this.matchingItems(modules).length;
  }

  private matchingItems(modules: Repository[]): Repository[] {
    if (!this.search) {
      return modules;
    }
    const search = this.search.toLowerCase();
    return modules.filter((item) => item.name.toLowerCase().indexOf(search) > -1);
  }

  private sortItems(modules: Repository[]): Repository[] {
    if (this.sort === 'stars') {
      return [...modules].sort((a, b) => b.stargazers_count - a.stargazers_count);
    }

    // pushed_at tracks the last commit, unlike updated_at which also moves on metadata changes
    const dateOf = (item: Repository) => (this.sort === 'updated' ? item.pushed_at : item.created_at);
    return [...modules].sort((a, b) => this.time(dateOf(b)) - this.time(dateOf(a)));
  }

  private time(date: Date | string): number {
    const time = date ? new Date(date).getTime() : 0;
    return isNaN(time) ? 0 : time;
  }
}
