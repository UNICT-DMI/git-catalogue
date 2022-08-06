import { ChangeDetectorRef, Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faSearch, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { Repository } from 'src/@types';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(
    public catalogueService: CatalogueService,
    public cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private location: Location) {}

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
  
  get isCatalogueLoading(): boolean {
    return this.catalogueService.isLoading;
  }

  get tabIndex(): number {
    if(this.isCatalogueLoading)
      return -1;

    const tabName = this.route.snapshot.paramMap.get('tab');
    return tabName ? this.catalogueService.confTabPaths.indexOf(`/${tabName}`) : 0;
  }

  getPathByTab(tab: string): string {
    return this.catalogueService.CONF.tabs[tab].path;
  }

  currentPageItems(modules: { items: Repository[] }): Repository[] {
    let filteredItems = modules.items;
    if (!!this.search) {
      filteredItems = filteredItems.filter((item) => item.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1);
    }
    return filteredItems.slice(this.catalogueService.CONF.pageSize * this.page, this.catalogueService.CONF.pageSize * (this.page + 1));
  }
}
