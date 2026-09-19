import { Component } from '@angular/core';
import { CatalogueService } from '../services/catalogue/catalogue.service';
import { faCaretLeft, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-howto',
    templateUrl: './howto.component.html',
    standalone: false
})
export class HowtoComponent {
  constructor(public catalogueService: CatalogueService) {}

  readonly faCaretLeft: IconDefinition = faCaretLeft;
}
