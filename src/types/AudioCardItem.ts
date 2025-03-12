import type { AudioCategory } from "./TenantFeature";

export interface AudioCardItem {
  id: string;
  title: string;
  instruction: string;
  category: AudioCategory;
  tags?: string[];
  enabled: boolean;
}
