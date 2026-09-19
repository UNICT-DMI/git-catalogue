import { InjectionToken } from '@angular/core';
import { Config } from '../catalogue/catalogue.model';

export const APP_CONFIG = new InjectionToken<Config>('APP_CONFIG');

