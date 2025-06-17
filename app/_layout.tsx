import { useThemeColor } from "@/hooks/useThemeStyle";
import { Stack } from "expo-router";
import { View } from "react-native";

function accountSwitcher() {
  return <View style={{ paddingHorizontal: 10 }}></View>;
}

export default function RootLayout() {
  const styleSheet = useThemeColor();

  return <Stack screenOptions={{
    headerLeft: accountSwitcher,
    headerStyle: styleSheet.header,
    headerTintColor: styleSheet.header.color,
    headerTitleStyle: styleSheet.headerTitle
  }}>
    <Stack.Screen name="index" options={{
      title: "AutoLogout Manager",
    }}/>
  </Stack>;
}
