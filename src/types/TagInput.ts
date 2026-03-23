export interface TagItem {
  _id: string;
  title: string;
  description: string;
  icon?: string | null | undefined;
  iconColor?: string | null | undefined;
  categories?: string[];
}

export type TagList = TagItem[];

export const ONBOARDING_CATEGORY = "self-onboarding";
