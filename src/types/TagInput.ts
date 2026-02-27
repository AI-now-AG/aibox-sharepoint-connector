export interface TagItem {
  _id: string;
  title: string;
  description: string;
  icon?: string | null | undefined;
  iconColor?: string | null | undefined;
  resellerCodes?: string[];
}

export type TagList = TagItem[];
