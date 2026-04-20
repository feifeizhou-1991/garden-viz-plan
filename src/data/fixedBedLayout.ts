import { GardenBed } from '@/types/garden';

/**
 * Fixed bed layout for every garden.
 * Beds are pinned, non-resizable and cannot be added or removed.
 * Coordinates are in canvas pixels (top-left origin).
 * Sizing reference: each cell is 64px with 8px gap; grid padding 32px,
 * card padding 32px, header ~40px.
 */
export type FixedBedTemplate = Pick<
  GardenBed,
  'name' | 'width' | 'height' | 'x' | 'y'
>;

export const FIXED_BED_LAYOUT: FixedBedTemplate[] = [
  // Top row
  { name: 'Bed 1', width: 4, height: 9, x: 40,   y: 40 },
  { name: 'Bed 2', width: 3, height: 9, x: 440,  y: 40 },
  { name: 'Bed 3', width: 3, height: 7, x: 780,  y: 40 },
  { name: 'Bed 4', width: 3, height: 6, x: 1120, y: 40 },
  // Bottom row — beds 5/6/7/8 share the same bottom edge (anchored to tallest, Bed 8)
  { name: 'Bed 5', width: 2, height: 5, x: 40,   y: 1116 },
  { name: 'Bed 6', width: 3, height: 6, x: 340,  y: 1044 },
  { name: 'Bed 7', width: 5, height: 6, x: 700,  y: 1044 },
  { name: 'Bed 8', width: 3, height: 8, x: 1180, y: 900  },
];

export const FIXED_CANVAS_WIDTH = 1560;
export const FIXED_CANVAS_HEIGHT = 1560;
