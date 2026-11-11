import {
  DefaultTheme,
  NavigationContainer,
  NavigationIndependentTree,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SheetStage } from './SheetStage';
import { createSheetController, SheetMotionProvider } from './sheetMotion';
import type { SheetStackParamList, StackedSheetsProps } from './types';

const Stack = createNativeStackNavigator<SheetStackParamList>();
const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#000', card: '#000', border: '#000' },
};

function HistoryScreen() {
  return <View style={styles.frame} />;
}

export function StackedSheets(props: StackedSheetsProps) {
  const [controller] = useState(() => createSheetController(props.initialSheets));
  const attachNavigator = useCallback(
    (navigator: NavigationContainerRef<SheetStackParamList> | null) => {
      controller.attachNavigator(navigator);
    },
    [controller],
  );

  return (
    <SheetMotionProvider controller={controller}>
      <View style={styles.frame}>
        <NavigationIndependentTree>
          <NavigationContainer
            ref={attachNavigator}
            theme={theme}
            initialState={controller.initialNavigationState}
            onStateChange={controller.onNavigationStateChange}
          >
            <Stack.Navigator
              initialRouteName="Inbox"
              screenOptions={{
                headerShown: false,
                animation: 'none',
                gestureEnabled: false,
                fullScreenGestureEnabled: false,
                freezeOnBlur: false,
                contentStyle: styles.frame,
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
        </NavigationIndependentTree>
        <View collapsable={false} style={styles.stage} pointerEvents="box-none">
          <SheetStage {...props} />
        </View>
      </View>
    </SheetMotionProvider>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: '#000' },
  stage: { ...StyleSheet.absoluteFill, zIndex: 1 },
});
