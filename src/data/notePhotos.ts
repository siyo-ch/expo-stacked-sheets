import type { ImageSourcePropType } from 'react-native';

export const notePhotos: Record<string, { source: ImageSourcePropType; label: string } | undefined> = {
  reading: {
    source: require('../../assets/notes/reading.jpg'),
    label: 'An open book on a dark wooden table',
  },
  weekend: {
    source: require('../../assets/notes/weekend.jpg'),
    label: 'A single pink flower against a pale gray background',
  },
  trip: {
    source: require('../../assets/notes/fuji.jpg'),
    label: 'Sunlight on the snow-covered peak of Mount Fuji',
  },
  coffee: {
    source: require('../../assets/notes/coffee.jpg'),
    label: 'A brown coffee cup casting a shadow on a light surface',
  },
};
