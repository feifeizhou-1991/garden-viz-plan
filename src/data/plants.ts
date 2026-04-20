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

// Helper for square Unsplash thumbnails
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=200&h=200&q=70`;

export const PLANTS: Plant[] = [
  // ---------- Vegetables — Fruiting ----------
  { id: 'tomato', name: 'Tomato', type: 'fruit', color: 'bg-red-500', icon: tomatoImg, spacing: 2, season: ['Spring', 'Summer'] },
  { id: 'pepper', name: 'Bell Pepper', type: 'fruit', color: 'bg-yellow-500', icon: pepperImg, spacing: 2, season: ['Summer'] },
  { id: 'cucumber', name: 'Cucumber', type: 'fruit', color: 'bg-green-500', icon: cucumberImg, spacing: 3, season: ['Summer'] },
  { id: 'zucchini', name: 'Zucchini', type: 'fruit', color: 'bg-green-600', icon: u('1596397249129-c7a8f8718873'), spacing: 3, season: ['Summer'] },
  { id: 'eggplant', name: 'Eggplant', type: 'fruit', color: 'bg-purple-700', icon: u('1601493700631-2b16ec4b4716'), spacing: 2, season: ['Summer'] },
  { id: 'pumpkin', name: 'Pumpkin', type: 'fruit', color: 'bg-orange-600', icon: u('1570586437263-ab629fccc818'), spacing: 4, season: ['Summer', 'Fall'] },
  { id: 'squash', name: 'Butternut Squash', type: 'fruit', color: 'bg-amber-500', icon: u('1570586437263-ab629fccc818'), spacing: 3, season: ['Summer', 'Fall'] },
  { id: 'chili', name: 'Chili Pepper', type: 'fruit', color: 'bg-red-600', icon: u('1583119912267-cc97c911e416'), spacing: 1, season: ['Summer'] },
  { id: 'corn', name: 'Sweet Corn', type: 'fruit', color: 'bg-yellow-400', icon: u('1601593768799-76d3c00fed3b'), spacing: 2, season: ['Summer'] },
  { id: 'pea', name: 'Peas', type: 'fruit', color: 'bg-green-400', icon: u('1587735243615-c03f25aaff15'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'bean', name: 'Green Beans', type: 'fruit', color: 'bg-green-500', icon: u('1571167530149-c1105da34c95'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'okra', name: 'Okra', type: 'fruit', color: 'bg-green-600', icon: u('1607301406259-dfb186e15de8'), spacing: 2, season: ['Summer'] },

  // ---------- Vegetables — Leafy ----------
  { id: 'lettuce', name: 'Lettuce', type: 'leafy', color: 'bg-plant-leafy', icon: lettuceImg, spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'spinach', name: 'Spinach', type: 'leafy', color: 'bg-green-600', icon: spinachImg, spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'kale', name: 'Kale', type: 'leafy', color: 'bg-green-700', icon: u('1524179091875-bf99a9a6af57'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'arugula', name: 'Arugula', type: 'leafy', color: 'bg-green-500', icon: u('1622206151226-18ca2c9ab4a1'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'chard', name: 'Swiss Chard', type: 'leafy', color: 'bg-rose-500', icon: u('1576181256399-834e3b3a49bf'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'cabbage', name: 'Cabbage', type: 'leafy', color: 'bg-green-400', icon: u('1551888658-1e9d4a1ea3f6'), spacing: 2, season: ['Spring', 'Fall'] },
  { id: 'broccoli', name: 'Broccoli', type: 'leafy', color: 'bg-green-700', icon: u('1459411552884-841db9b3cc2a'), spacing: 2, season: ['Spring', 'Fall'] },
  { id: 'cauliflower', name: 'Cauliflower', type: 'leafy', color: 'bg-stone-100', icon: u('1568584711271-6c929fb49b60'), spacing: 2, season: ['Spring', 'Fall'] },
  { id: 'brussels', name: 'Brussels Sprouts', type: 'leafy', color: 'bg-green-600', icon: u('1601557282637-6cf30c44a3f7'), spacing: 2, season: ['Fall'] },
  { id: 'bokchoy', name: 'Bok Choy', type: 'leafy', color: 'bg-green-500', icon: u('1576045057995-568f588f82fb'), spacing: 1, season: ['Spring', 'Fall'] },

  // ---------- Vegetables — Root ----------
  { id: 'carrot', name: 'Carrot', type: 'root', color: 'bg-orange-500', icon: carrotImg, spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'radish', name: 'Radish', type: 'root', color: 'bg-pink-500', icon: radishImg, spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'onion', name: 'Onion', type: 'root', color: 'bg-purple-400', icon: onionImg, spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'garlic', name: 'Garlic', type: 'root', color: 'bg-stone-200', icon: u('1540148426945-6cf22a6b2383'), spacing: 1, season: ['Fall', 'Winter'] },
  { id: 'beet', name: 'Beetroot', type: 'root', color: 'bg-red-700', icon: u('1593105544559-ecb03bf76f82'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'potato', name: 'Potato', type: 'root', color: 'bg-amber-700', icon: u('1518977676601-b53f82aba655'), spacing: 2, season: ['Spring', 'Summer'] },
  { id: 'sweetpotato', name: 'Sweet Potato', type: 'root', color: 'bg-orange-700', icon: u('1596097635121-14b38c5d7a55'), spacing: 2, season: ['Summer', 'Fall'] },
  { id: 'turnip', name: 'Turnip', type: 'root', color: 'bg-purple-300', icon: u('1591287083773-9a4d2b8b4a44'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'parsnip', name: 'Parsnip', type: 'root', color: 'bg-stone-300', icon: u('1518977956812-cd3dbadaaf31'), spacing: 1, season: ['Fall', 'Winter'] },
  { id: 'leek', name: 'Leek', type: 'root', color: 'bg-green-300', icon: u('1576181256399-834e3b3a49bf'), spacing: 1, season: ['Fall', 'Winter'] },
  { id: 'shallot', name: 'Shallot', type: 'root', color: 'bg-rose-300', icon: u('1518977822534-7049a61ee0c2'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'ginger', name: 'Ginger', type: 'root', color: 'bg-amber-400', icon: u('1573414405398-91d7e34dffae'), spacing: 1, season: ['Summer'] },

  // ---------- Herbs ----------
  { id: 'basil', name: 'Basil', type: 'herb', color: 'bg-plant-herb', icon: basilImg, spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'parsley', name: 'Parsley', type: 'herb', color: 'bg-green-500', icon: parsleyImg, spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'mint', name: 'Mint', type: 'herb', color: 'bg-green-400', icon: u('1628556270448-4d4e1ab1bdf6'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'rosemary', name: 'Rosemary', type: 'herb', color: 'bg-green-700', icon: u('1515586000433-45406d8e6662'), spacing: 1, season: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { id: 'thyme', name: 'Thyme', type: 'herb', color: 'bg-green-600', icon: u('1600831606101-2d96a17b6e93'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'oregano', name: 'Oregano', type: 'herb', color: 'bg-green-500', icon: u('1599909533259-6dde3f50e6db'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'sage', name: 'Sage', type: 'herb', color: 'bg-stone-400', icon: u('1611379146019-dd9d62e22f37'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'cilantro', name: 'Cilantro', type: 'herb', color: 'bg-green-500', icon: u('1620311051298-8e6cc40b76a0'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'dill', name: 'Dill', type: 'herb', color: 'bg-green-400', icon: u('1599909594080-69e8d8f8c8c3'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'chives', name: 'Chives', type: 'herb', color: 'bg-green-500', icon: u('1599909533259-6dde3f50e6db'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'lavender', name: 'Lavender', type: 'herb', color: 'bg-purple-400', icon: u('1499002238440-d264edd596ec'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'tarragon', name: 'Tarragon', type: 'herb', color: 'bg-green-600', icon: u('1611379146019-dd9d62e22f37'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'lemonbalm', name: 'Lemon Balm', type: 'herb', color: 'bg-lime-500', icon: u('1628556270448-4d4e1ab1bdf6'), spacing: 1, season: ['Spring', 'Summer'] },

  // ---------- Fruits & Berries ----------
  { id: 'strawberry', name: 'Strawberry', type: 'fruit', color: 'bg-red-400', icon: u('1464965911861-746a04b4bca6'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'raspberry', name: 'Raspberry', type: 'fruit', color: 'bg-rose-500', icon: u('1577069861033-55d04cec4ef5'), spacing: 2, season: ['Summer'] },
  { id: 'blueberry', name: 'Blueberry', type: 'fruit', color: 'bg-blue-600', icon: u('1498557850523-fd3d118b962e'), spacing: 2, season: ['Summer'] },
  { id: 'blackberry', name: 'Blackberry', type: 'fruit', color: 'bg-zinc-800', icon: u('1615485290382-441e4d049cb5'), spacing: 2, season: ['Summer'] },
  { id: 'rhubarb', name: 'Rhubarb', type: 'fruit', color: 'bg-rose-600', icon: u('1620207418302-439b387441b0'), spacing: 2, season: ['Spring', 'Summer'] },
  { id: 'grape', name: 'Grape Vine', type: 'fruit', color: 'bg-purple-600', icon: u('1537640538966-79f369143f8f'), spacing: 3, season: ['Summer', 'Fall'] },
  { id: 'melon', name: 'Watermelon', type: 'fruit', color: 'bg-green-600', icon: u('1563114773-84221bd62daa'), spacing: 4, season: ['Summer'] },
  { id: 'cantaloupe', name: 'Cantaloupe', type: 'fruit', color: 'bg-orange-300', icon: u('1571575173700-afb9492e6a50'), spacing: 3, season: ['Summer'] },
  { id: 'fig', name: 'Fig Tree', type: 'fruit', color: 'bg-purple-800', icon: u('1601379329542-31c59e3f5fad'), spacing: 4, season: ['Summer', 'Fall'] },
  { id: 'lemon', name: 'Lemon Tree', type: 'fruit', color: 'bg-yellow-300', icon: u('1590502593747-42a996133562'), spacing: 4, season: ['Spring', 'Summer', 'Fall', 'Winter'] },

  // ---------- Flowers ----------
  { id: 'sunflower', name: 'Sunflower', type: 'flower', color: 'bg-yellow-500', icon: u('1597848212624-a19eb35e2651'), spacing: 1, season: ['Summer'] },
  { id: 'marigold', name: 'Marigold', type: 'flower', color: 'bg-orange-500', icon: u('1597305877032-0668b3c6413a'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'rose', name: 'Rose', type: 'flower', color: 'bg-rose-500', icon: u('1518895949257-7621c3c786d7'), spacing: 2, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'tulip', name: 'Tulip', type: 'flower', color: 'bg-red-500', icon: u('1520763185298-1b434c919102'), spacing: 1, season: ['Spring'] },
  { id: 'daffodil', name: 'Daffodil', type: 'flower', color: 'bg-yellow-400', icon: u('1490750967868-88aa4486c946'), spacing: 1, season: ['Spring'] },
  { id: 'daisy', name: 'Daisy', type: 'flower', color: 'bg-stone-100', icon: u('1465146633011-14f8e0781093'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'zinnia', name: 'Zinnia', type: 'flower', color: 'bg-pink-500', icon: u('1599824389968-bf2bcb4a3a72'), spacing: 1, season: ['Summer', 'Fall'] },
  { id: 'cosmos', name: 'Cosmos', type: 'flower', color: 'bg-pink-400', icon: u('1597305877032-0668b3c6413a'), spacing: 1, season: ['Summer', 'Fall'] },
  { id: 'nasturtium', name: 'Nasturtium', type: 'flower', color: 'bg-orange-500', icon: u('1597305877032-0668b3c6413a'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'pansy', name: 'Pansy', type: 'flower', color: 'bg-purple-500', icon: u('1490750967868-88aa4486c946'), spacing: 1, season: ['Spring', 'Fall'] },
  { id: 'petunia', name: 'Petunia', type: 'flower', color: 'bg-pink-500', icon: u('1490750967868-88aa4486c946'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'dahlia', name: 'Dahlia', type: 'flower', color: 'bg-rose-600', icon: u('1599824389968-bf2bcb4a3a72'), spacing: 2, season: ['Summer', 'Fall'] },
  { id: 'hydrangea', name: 'Hydrangea', type: 'flower', color: 'bg-blue-400', icon: u('1503424886307-b090341d25d1'), spacing: 3, season: ['Summer'] },
  { id: 'peony', name: 'Peony', type: 'flower', color: 'bg-pink-300', icon: u('1518895949257-7621c3c786d7'), spacing: 2, season: ['Spring', 'Summer'] },
  { id: 'lily', name: 'Lily', type: 'flower', color: 'bg-orange-400', icon: u('1490750967868-88aa4486c946'), spacing: 1, season: ['Summer'] },
  { id: 'iris', name: 'Iris', type: 'flower', color: 'bg-purple-600', icon: u('1490750967868-88aa4486c946'), spacing: 1, season: ['Spring', 'Summer'] },
  { id: 'echinacea', name: 'Echinacea', type: 'flower', color: 'bg-pink-500', icon: u('1597305877032-0668b3c6413a'), spacing: 1, season: ['Summer', 'Fall'] },

  // ---------- Other garden plants ----------
  { id: 'aloe', name: 'Aloe Vera', type: 'other', color: 'bg-green-500', icon: u('1509423350716-97f9360b4e09'), spacing: 1, season: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { id: 'fern', name: 'Fern', type: 'other', color: 'bg-green-700', icon: u('1509719662282-180c3962adf2'), spacing: 2, season: ['Spring', 'Summer', 'Fall'] },
  { id: 'bamboo', name: 'Bamboo', type: 'other', color: 'bg-lime-700', icon: u('1503788311183-fa3bf9c4bc32'), spacing: 2, season: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { id: 'succulent', name: 'Succulent', type: 'other', color: 'bg-emerald-400', icon: u('1459411552884-841db9b3cc2a'), spacing: 1, season: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { id: 'ivy', name: 'Ivy', type: 'other', color: 'bg-green-700', icon: u('1416879595882-3373a0480b5b'), spacing: 1, season: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { id: 'hosta', name: 'Hosta', type: 'other', color: 'bg-green-600', icon: u('1416879595882-3373a0480b5b'), spacing: 2, season: ['Spring', 'Summer'] },
  { id: 'boxwood', name: 'Boxwood', type: 'other', color: 'bg-green-700', icon: u('1416879595882-3373a0480b5b'), spacing: 2, season: ['Spring', 'Summer', 'Fall', 'Winter'] },
  { id: 'clover', name: 'Clover', type: 'other', color: 'bg-green-500', icon: u('1494059980473-813e73ee784b'), spacing: 1, season: ['Spring', 'Summer', 'Fall'] },
];