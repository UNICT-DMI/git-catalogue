import { Component, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CatalogueComponent } from './catalogue/catalogue.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  constructor(injector: Injector) {
    const catalogueElement = createCustomElement(CatalogueComponent, { injector });
    customElements.define('catalogue-element', catalogueElement);
  }
}
