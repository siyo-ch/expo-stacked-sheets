import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { enableFreeze } from 'react-native-screens';

import App from './App';

enableFreeze(false);

registerRootComponent(App);
