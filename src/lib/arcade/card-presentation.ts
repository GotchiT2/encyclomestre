/** Presentation IDs always retain their article/copy meaning. */
export type CardDetailContext = 'article' | 'owned' | 'other' | 'opening';
export type CardQuantity = { count: number | undefined; scope: 'article' | 'variant' | 'world' };
