import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeStyle";
import { AccountsProvider, useAccounts } from "@/providers/AccountsProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

function DrawerContent(props: DrawerContentComponentProps & { activeTintColor: string, inactiveTintColor: string }) {
  const styleSheet = useThemeColor();
  const {accounts} = useAccounts();
  const activeRoute = props.state.routes[props.state.index];
  const activeTintColor = props.activeTintColor;
  const inactiveTintColor = props.inactiveTintColor;
  
  return (
    <DrawerContentScrollView>
      <DrawerItem
        label="About"
        icon={({size}) => (
          <MaterialIcons name="info" color={activeRoute.name=="index" ? activeTintColor : inactiveTintColor} size={size}/>
        )}
        focused={activeRoute.name=='index'}
        labelStyle={{ color: activeRoute.name === "index" ? activeTintColor : inactiveTintColor }}
        onPress={() => router.push("/")}
      />
      <View style={styleSheet.separator}/>
      <Text style={styleSheet.navLabel}>Accounts</Text>
      {
        Object.entries(accounts).map(([uuid, account]) => {
          const focused = (
            activeRoute.name === "[uuid]"
            && activeRoute.params
            && 'uuid' in activeRoute.params
            && activeRoute.params?.uuid === uuid
          );
          return <DrawerItem
            key={uuid}
            label={account.name}
            icon={({size}) => (
              <MaterialIcons name="computer" color={focused ? activeTintColor : inactiveTintColor} size={size}/>
            )}
            focused={focused}
            labelStyle={{ color: focused ? activeTintColor : inactiveTintColor }}
            onPress={() => router.push({pathname: "/[uuid]", params:{uuid}})}
          />;
        })
      }
      <DrawerItem
        label="Add an account"
        icon={({size}) => (
          <MaterialIcons name="add" color={activeRoute.name=="addAccount" ? activeTintColor : inactiveTintColor} size={size}/>
        )}
        focused={activeRoute.name=='addAccount'}
        labelStyle={{ color: activeRoute.name=="addAccount" ? activeTintColor : inactiveTintColor }}
        onPress={() => router.push("/addAccount")}
      />
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  const styleSheet = useThemeColor();
  const colorScheme = useColorScheme() == 'light'? 'light': 'dark';

  return (
    <AccountsProvider>
      <StatusBar style={colorScheme == 'dark'? 'light': 'dark'}/>
      <Drawer
        drawerContent={(props) => DrawerContent({...props, activeTintColor: Colors[colorScheme].tint, inactiveTintColor: Colors[colorScheme].inactive})}
        screenOptions={{
          headerStyle: styleSheet.header,
          headerTintColor: Colors[colorScheme].text,
          drawerStyle: styleSheet.view,
        }}
      >
        <Drawer.Screen name="index" options={{title: "About"}}/>
        <Drawer.Screen name="addAccount" options={{title: "Add an account"}}/>
      </Drawer>
    </AccountsProvider>
  );
}
