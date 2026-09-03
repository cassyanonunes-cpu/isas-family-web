import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { CallProvider } from './src/contexts/CallContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CallProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </CallProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
