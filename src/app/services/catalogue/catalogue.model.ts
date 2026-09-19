export interface Config {
  page: number;
  perPage: number;
  pageSize: number;
  tabs: Record<string, Tab>;
  usePreGeneratedFile?: boolean;  // Option to use pre-generated file instead of API
  preGeneratedFileUrl?: string;   // URL to the pre-generated file
  globalSearch?: boolean;         // Global default for searching across all GitHub vs org-specific
}

export interface Tab {
  topic?: string;
  org?: string;
  path: string;
  globalSearch?: boolean;         // Per-tab override for global vs org-specific search
}
