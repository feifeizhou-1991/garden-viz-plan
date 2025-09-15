import { Plant } from '../types/garden';
import tomatoImg from '../assets/plants/tomato.jpg';
import lettuceImg from '../assets/plants/lettuce.jpg';
import carrotImg from '../assets/plants/carrot.jpg';
import basilImg from '../assets/plants/basil.jpg';
import pepperImg from '../assets/plants/pepper.jpg';
import spinachImg from '../assets/plants/spinach.jpg';
import radishImg from '../assets/plants/radish.jpg';
import cucumberImg from '../assets/plants/cucumber.jpg';
import onionImg from '../assets/plants/onion.jpg';
import parsleyImg from '../assets/plants/parsley.jpg';

export const PLANTS: Plant[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    type: 'fruit',
    color: 'bg-red-500',
    icon: tomatoImg,
    spacing: 2,
    season: ['Spring', 'Summer']
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    type: 'leafy',
    color: 'bg-plant-leafy',
    icon: lettuceImg,
    spacing: 1,
    season: ['Spring', 'Fall']
  },
  {
    id: 'carrot',
    name: 'Carrot',
    type: 'root',
    color: 'bg-orange-500',
    icon: carrotImg,
    spacing: 1,
    season: ['Spring', 'Summer', 'Fall']
  },
  {
    id: 'basil',
    name: 'Basil',
    type: 'herb',
    color: 'bg-plant-herb',
    icon: basilImg,
    spacing: 1,
    season: ['Spring', 'Summer']
  },
  {
    id: 'pepper',
    name: 'Bell Pepper',
    type: 'fruit',
    color: 'bg-yellow-500',
    icon: pepperImg,
    spacing: 2,
    season: ['Summer']
  },
  {
    id: 'spinach',
    name: 'Spinach',
    type: 'leafy',
    color: 'bg-green-600',
    icon: spinachImg,
    spacing: 1,
    season: ['Spring', 'Fall']
  },
  {
    id: 'radish',
    name: 'Radish',
    type: 'root',
    color: 'bg-pink-500',
    icon: radishImg,
    spacing: 1,
    season: ['Spring', 'Fall']
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    type: 'fruit',
    color: 'bg-green-500',
    icon: cucumberImg,
    spacing: 3,
    season: ['Summer']
  },
  {
    id: 'onion',
    name: 'Onion',
    type: 'root',
    color: 'bg-purple-400',
    icon: onionImg,
    spacing: 1,
    season: ['Spring', 'Summer', 'Fall']
  },
  {
    id: 'parsley',
    name: 'Parsley',
    type: 'herb',
    color: 'bg-green-500',
    icon: parsleyImg,
    spacing: 1,
    season: ['Spring', 'Summer', 'Fall']
  }
];