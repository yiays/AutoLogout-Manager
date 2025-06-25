import { useThemeColor } from "@/hooks/useThemeStyle";
import { AccountsProvider, useAccounts } from "@/providers/AccountsProvider";
import { Account } from "@/services/syncService";
import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function RootLayout() {
  const styleSheet = useThemeColor();

  function accountButton(value:[string, Account]) {
    const [uuid, account] = value;
    return (
      <Link style={styleSheet.button} href={{pathname: '/[uuid]', params: {uuid: uuid}}} >
        <Text style={styleSheet.buttonText}>{account.name}</Text>
      </Link>
    )
  }

  function accountSwitcher() {
    const {accounts} = useAccounts();

    return (
      <View style={{ paddingHorizontal: 10 }}>
        {Object.entries(accounts).map(accountButton)}
        <Link style={styleSheet.button} href={'/addAccount'}>
          <Text style={styleSheet.buttonText} accessibilityLabel="Add account">+</Text>
        </Link>
      </View>
    );
  }

  return (
    <AccountsProvider>
      <Stack screenOptions={{
        headerLeft: accountSwitcher,
        headerStyle: styleSheet.header,
        headerTintColor: styleSheet.header.color,
        headerTitleStyle: styleSheet.headerTitle
      }}>
        <Stack.Screen name="index" options={{title: "AutoLogout Manager"}}/>
        <Stack.Screen name="[uuid]" options={{}}/>
        <Stack.Screen name="addAccount" options={{title: "Add an account", presentation:'card'}}/>
      </Stack>
    </AccountsProvider>
  );
}
