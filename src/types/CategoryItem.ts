export interface CategoryItem {
  checked: boolean;
  title: string;
  group?: {
    checked: boolean;
    title: string;
  }[];
}
