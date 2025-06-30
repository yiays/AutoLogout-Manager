import { useThemeColor } from "@/hooks/useThemeStyle";
import { AccountsProvider, useAccounts } from "@/providers/AccountsProvider";
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";

function DrawerContent(props: DrawerContentComponentProps /*& { activeTintColor: string, inactiveTintColor: string }*/) {
  const {accounts} = useAccounts();
  const activeRoute = props.state.routes[props.state.index];
  const activeTintColor = props.activeTintColor ?? "#2196f3";
  const inactiveTintColor = props.inactiveTintColor ?? "#222";
  
  return (
    <DrawerContentScrollView>
      <DrawerItem
        label="About"
        focused={activeRoute.name=='index'}
        labelStyle={{ color: activeRoute.name === "index" ? activeTintColor : inactiveTintColor }}
        onPress={() => router.push("/")}
      />
      {
        Object.entries(accounts).map(([uuid, account]) => {
          const focused = activeRoute.name === "[uuid]" && activeRoute.params?.uuid === uuid;
          return <DrawerItem
            key={uuid}
            label={account.name}
            focused={focused}
            labelStyle={{ color: focused ? activeTintColor : inactiveTintColor }}
            onPress={() => router.push({pathname: "/[uuid]", params:{uuid}})}
          />;
        })
      }
      <DrawerItem
        label="Add an account"
        focused={activeRoute.name=='addAccount'}
        labelStyle={{ color: activeRoute.name=="addAccount" ? activeTintColor : inactiveTintColor }}
        onPress={() => router.push("/addAccount")}
      />
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  const styleSheet = useThemeColor();

  return (
    <AccountsProvider>
      <Drawer drawerContent={DrawerContent} screenOptions={{
        headerStyle: styleSheet.header,
        headerTintColor: styleSheet.header.color,
        drawerStyle: styleSheet.view,
      }}>
        <Drawer.Screen name="index" options={{title: "About"}}/>
        <Drawer.Screen name="addAccount" options={{title: "Add an account"}}/>
      </Drawer>
    </AccountsProvider>
  );
}
