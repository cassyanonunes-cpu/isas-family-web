import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageCircle, Users, Phone, Settings } from 'lucide-react-native';

import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme/theme';

// Telas
import LoginScreen from '../screens/Auth/LoginScreen';
import SplashScreen from '../screens/Splash/SplashScreen';
import ConversationsScreen from '../screens/Main/ConversationsScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import NewConversationScreen from '../screens/Main/NewConversationScreen';
import FamilyScreen from '../screens/Main/FamilyScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';
import FamilyMapScreen from '../screens/Main/FamilyMapScreen';
import CallsListScreen from '../screens/Main/CallsListScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import MemberProfileScreen from '../screens/Main/MemberProfileScreen';
import GroupInfoScreen from '../screens/Main/GroupInfoScreen';
import CallScreen from '../screens/Main/CallScreen';
import { ThemeContext } from '../contexts/ThemeContext';

// RootStack types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Chat: { conversationId: string };
  NewConversation: undefined;
  Map: undefined;
  Profile: undefined;
  MemberProfile: { userId: string };
  GroupInfo: { conversationId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Aba Principal
function MainTabs() {
  const { colors } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen 
        name="Conversas" 
        component={ConversationsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Chamadas" 
        component={CallsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Phone color={color} size={size} />,
          title: 'Chamadas'
        }}
      />
      <Tab.Screen 
        name="Família" 
        component={FamilyScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Configurações" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);
  const { colors, mode } = useContext(ThemeContext);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={{
      ...DefaultTheme,
      dark: mode === 'dark',
      colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary
      }
    }}>
      <Stack.Navigator screenOptions={{ 
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' }
      }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="NewConversation" component={NewConversationScreen} options={{ presentation: 'modal', title: 'Nova Conversa' }} />
            <Stack.Screen name="Map" component={FamilyMapScreen} options={{ title: 'Família no Mapa' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
            <Stack.Screen name="MemberProfile" component={MemberProfileScreen} options={{ title: 'Perfil do Membro' }} />
            <Stack.Screen name="GroupInfo" component={GroupInfoScreen} options={{ title: 'Dados do Grupo' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
      <CallScreen />
    </NavigationContainer>
  );
}
