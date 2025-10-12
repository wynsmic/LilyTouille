export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const recipes: Recipe[] = [
  {
    id: '1',
    title: 'Classic Margherita Pizza',
    description:
      'A traditional Italian pizza with fresh tomatoes, mozzarella, and basil.',
    image:
      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
    tags: ['Italian', 'Vegetarian', 'Quick'],
    ingredients: [
      'Pizza dough',
      'Tomato sauce',
      'Fresh mozzarella',
      'Fresh basil',
      'Olive oil',
    ],
    instructions: [
      'Preheat oven to 450°F (230°C)',
      'Roll out pizza dough',
      'Spread tomato sauce evenly',
      'Add mozzarella slices',
      'Bake for 12-15 minutes',
      'Garnish with fresh basil and olive oil',
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: 'easy',
  },
  {
    id: '2',
    title: 'Beef Bourguignon',
    description:
      'A rich French stew made with beef braised in red wine with vegetables.',
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
    tags: ['French', 'Beef', 'Comfort Food'],
    ingredients: [
      'Beef chuck',
      'Red wine',
      'Carrots',
      'Onions',
      'Mushrooms',
      'Bacon',
      'Garlic',
    ],
    instructions: [
      'Cut beef into cubes and season',
      'Sear beef in batches',
      'Sauté vegetables',
      'Add wine and simmer for 2-3 hours',
      'Serve with crusty bread',
    ],
    prepTime: 30,
    cookTime: 180,
    servings: 6,
    difficulty: 'hard',
  },
  {
    id: '3',
    title: 'Thai Green Curry',
    description:
      'Aromatic Thai curry with coconut milk, vegetables, and your choice of protein.',
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    tags: ['Thai', 'Spicy', 'Coconut'],
    ingredients: [
      'Green curry paste',
      'Coconut milk',
      'Bell peppers',
      'Bamboo shoots',
      'Thai basil',
      'Fish sauce',
    ],
    instructions: [
      'Heat curry paste in coconut milk',
      'Add vegetables and protein',
      'Simmer for 15-20 minutes',
      'Season with fish sauce',
      'Garnish with Thai basil',
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'medium',
  },
  {
    id: '4',
    title: 'Mediterranean Quinoa Bowl',
    description:
      'A healthy and colorful bowl with quinoa, vegetables, and Mediterranean flavors.',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    tags: ['Healthy', 'Mediterranean', 'Vegetarian', 'Quick'],
    ingredients: [
      'Quinoa',
      'Cherry tomatoes',
      'Cucumber',
      'Red onion',
      'Feta cheese',
      'Olives',
      'Lemon',
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Chop all vegetables',
      'Mix quinoa with vegetables',
      'Add feta and olives',
      'Dress with lemon juice and olive oil',
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
  },
  {
    id: '5',
    title: 'Chocolate Lava Cake',
    description:
      'Decadent chocolate cake with a molten center, perfect for dessert.',
    image:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
    tags: ['Dessert', 'Chocolate', 'French'],
    ingredients: [
      'Dark chocolate',
      'Butter',
      'Eggs',
      'Sugar',
      'Flour',
      'Vanilla extract',
    ],
    instructions: [
      'Melt chocolate and butter',
      'Beat eggs with sugar',
      'Combine chocolate mixture with eggs',
      'Fold in flour',
      'Bake at 425°F for 12-14 minutes',
    ],
    prepTime: 20,
    cookTime: 14,
    servings: 4,
    difficulty: 'medium',
  },
  {
    id: '6',
    title: 'Japanese Ramen',
    description:
      'Rich and flavorful ramen with homemade broth, noodles, and toppings.',
    image:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
    tags: ['Japanese', 'Noodles', 'Comfort Food'],
    ingredients: [
      'Ramen noodles',
      'Pork bones',
      'Soy sauce',
      'Miso paste',
      'Green onions',
      'Soft-boiled eggs',
    ],
    instructions: [
      'Make tonkotsu broth (8+ hours)',
      'Cook ramen noodles',
      'Prepare toppings',
      'Assemble bowls with broth and noodles',
      'Add toppings and serve immediately',
    ],
    prepTime: 60,
    cookTime: 480,
    servings: 4,
    difficulty: 'hard',
  },
];
