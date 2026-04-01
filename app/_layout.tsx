import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="new-proposal" />
      <Stack.Screen name="proposal/[id]" />
      <Stack.Screen name="services" /> {/* <-- Adiciona esta linha! */}
      <Stack.Screen name="new-service" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}