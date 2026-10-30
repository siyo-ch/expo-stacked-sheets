import {
  DefaultTheme,
  NavigationContainer,
  useIsFocused,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { MailStack } from '../components/MailStack';
import {
  SheetMotionProvider,
  navigationRef,
  onNavigationStateChange,
} from './sheetMotion';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000000',
    card: '#000000',
    border: '#000000',
  },
};

function RouteShell() {
  const focused = useIsFocused();
  if (!focused) {
    return <View style={styles.blank} />;
  }
  return <MailStack />;
}

export function RootNavigator() {
  return (
    <SheetMotionProvider>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onStateChange={onNavigationStateChange}
      >
        <Stack.Navigator
          initialRouteName="Inbox"
          screenOptions={{
            headerShown: false,
            animation: 'none',
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            freezeOnBlur: false,
            contentStyle: styles.scene,
          }}
        >
          <Stack.Screen name="Inbox" component={RouteShell} />
          <Stack.Screen name="Compose" component={RouteShell} />
        </Stack.Navigator>
      </NavigationContainer>
    </SheetMotionProvider>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scene: {
    backgroundColor: '#000000',
  },
});
