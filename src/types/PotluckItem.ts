export interface PotluckItem {
  id: string;
  gameId: string;
  userId: string;
  userName?: string;
  category: 'appetizer' | 'main' | 'side' | 'dessert' | 'beverage' | 'supplies';
  item: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}