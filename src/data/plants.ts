import { Plant } from '../types/garden';

export const PLANTS: Plant[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    type: 'fruit',
    color: 'bg-red-500',
    icon: '🍅',
    spacing: 2,
    season: ['Spring', 'Summer']
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    type: 'leafy',
    color: 'bg-plant-leafy',
    icon: '🥬',
    spacing: 1,
    season: ['Spring', 'Fall']
  },
  {
    id: 'carrot',
    name: 'Carrot',
    type: 'root',
    color: 'bg-orange-500',
    icon: '🥕',
    spacing: 1,
    season: ['Spring', 'Summer', 'Fall']
  },
  {
    id: 'basil',
    name: 'Basil',
    type: 'herb',
    color: 'bg-plant-herb',
    icon: '🌿',
    spacing: 1,
    season: ['Spring', 'Summer']
  },
  {
    id: 'pepper',
    name: 'Bell Pepper',
    type: 'fruit',
    color: 'bg-yellow-500',
    icon: '🫑',
    spacing: 2,
    season: ['Summer']
  },
  {
    id: 'spinach',
    name: 'Spinach',
    type: 'leafy',
    color: 'bg-green-600',
    icon: '🥬',
    spacing: 1,
    season: ['Spring', 'Fall']
  },
  {
    id: 'radish',
    name: 'Radish',
    type: 'root',
    color: 'bg-pink-500',
    icon: '🥬',
    spacing: 1,
    season: ['Spring', 'Fall']
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    type: 'fruit',
    color: 'bg-green-500',
    icon: '🥒',
    spacing: 3,
    season: ['Summer']
  },
  {
    id: 'onion',
    name: 'Onion',
    type: 'root',
    color: 'bg-purple-400',
    icon: '🧅',
    spacing: 1,
    season: ['Spring', 'Summer', 'Fall']
  },
  {
    id: 'parsley',
    name: 'Parsley',
    type: 'herb',
    color: 'bg-green-500',
    icon: '🌿',
    spacing: 1,
    season: ['Spring', 'Summer', 'Fall']
  }
];