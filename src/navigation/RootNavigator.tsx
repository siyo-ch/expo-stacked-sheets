import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
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

function HistoryScreen() {
  return <View style={styles.blank} />;
}

export function RootNavigator() {
  return (
    <SheetMotionProvider>
      <View style={styles.frame}>
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
            <Stack.Screen name="Inbox" component={HistoryScreen} />
            <Stack.Screen
              name="Compose"
              component={HistoryScreen}
              getId={({ params }) => params.draftId}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <View collapsable={false} style={styles.stage} pointerEvents="box-none">
          <MailStack />
        </View>
      </View>
    </SheetMotionProvider>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blank: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scene: {
    backgroundColor: '#000000',
  },
  stage: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
});
