import { Location } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { IconDefinition, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Repository } from 'src/@types';
import { CatalogueService } from '../services/catalogue/catalogue.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  providers: [CatalogueService],
})
export class HomeComponent {
  constructor(public catalogueService: CatalogueService, public cdRef: ChangeDetectorRef, private location: Location) {}

  page = 0;
  search: string;
  readonly faSearch: IconDefinition = faSearch;
  readonly faTelegram: IconDefinition = faTelegram;

  refresh(): void {
    this.cdRef.detectChanges();
  }

  onPageChange(page: PageEvent): void {
    this.page = page.pageIndex;
  }

  onTabChange(tab: MatTabChangeEvent): void {
    const index = tab.index;
    const tabName = Object.keys(this.catalogueService.CONF.tabs)[index];
    const path = `/tab${this.catalogueService.CONF.tabs[tabName].path}`;
    if (this.location.path() !== path) {
      this.location.go(path);
    }
  }

  currentPageItems(modules: Repository[]): Repository[] {
    let filteredItems = modules;
    if (!!this.search) {
      filteredItems = filteredItems.filter((item) => item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1);
    }
    return filteredItems.slice(this.catalogueService.CONF.pageSize * this.page, this.catalogueService.CONF.pageSize * (this.page + 1));
  }
}
