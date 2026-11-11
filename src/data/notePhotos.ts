import type { ImageSourcePropType } from 'react-native';

export const notePhotos: Record<string, { source: ImageSourcePropType; label: string } | undefined> = {
  reading: {
    source: require('../../assets/notes/reading.jpg'),
    label: 'An open book outdoors in dappled sunlight',
  },
  weekend: {
    source: require('../../assets/notes/weekend.jpg'),
    label: 'A sunlit bouquet of ranunculus and eucalyptus',
  },
  trip: {
    source: require('../../assets/notes/kyoto.jpg'),
    label: 'A path through the Arashiyama Bamboo Grove',
  },
};
