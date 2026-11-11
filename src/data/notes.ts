export type Note = { id: string; title: string; body: string; date: string };

export const NOTES: Note[] = [
  {
    id: 'reading',
    title: 'Reading Notes',
    body: 'Good design does as little as possible. It keeps the essentials and lets everything else fall away.\n\nA question to come back to: what can I take away without losing what matters?',
    date: 'Today',
  },
  {
    id: 'weekend',
    title: 'Weekend Plans',
    body: 'Pick up a bunch of eucalyptus at the flower market on Saturday morning.\nSort the bookshelf and set aside a few books to donate.\nCall Grandma after dinner.',
    date: 'Today',
  },
  {
    id: 'trip',
    title: 'Three Days in Kyoto',
    body: 'Day 1: Visit Kiyomizu-dera, then walk down Ninenzaka to Gion.\nDay 2: Get to the Arashiyama Bamboo Grove before 7 a.m.\nDay 3: Grab a coffee and walk the Philosopher’s Path.',
    date: 'Yesterday',
  },
  {
    id: 'coffee',
    title: 'Pour-Over Recipe',
    body: '15 g of coffee and 240 mL of water at 92°C. Let it bloom for 30 seconds. Aim for a total brew time of 2 minutes and 30 seconds.',
    date: 'Monday',
  },
];
