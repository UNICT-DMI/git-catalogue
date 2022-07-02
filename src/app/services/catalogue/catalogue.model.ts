export interface Config {
  page: number;
  perPage: number;
  pageSize: number;
  tabs: Record<string, Tab>;
}

export interface Tab {
  topic?: string;
  org?: string;
}
