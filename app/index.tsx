import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { Link } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";

export default function Index() {
  const styleSheet = useThemeColor();
  const { accounts } = useAccounts();
  
  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        <Text style={styleSheet.title}>Welcome to AutoLogout Manager</Text>
        <Text style={styleSheet.paragraph}>
          Remotely manage time limits and bedtime on Windows computers you manage.
          This is a companion app to the Windows app known as AutoLogout.
        </Text>
        <Link style={styleSheet.paragraph} href="https://github.com/yiays/AutoLogout?tab=readme-ov-file#autologout" target="_blank">
          <Button title="AutoLogout for Windows"/>
        </Link>
        { accounts && Object.keys(accounts).length?
          <>
            <Text style={styleSheet.paragraph}>
              Manage your connected accounts by tapping the menu button at the top of the screen.
            </Text>
          </>
          :
          <>
            <Text style={styleSheet.smallTitle}>Have you prepared the computers you want to manage?</Text>
            <Text style={styleSheet.paragraph}>
              Make sure you've installed and set up AutoLogout on any computers you want to manage.
            </Text>
            <Text style={styleSheet.smallTitle}>Next steps</Text>
            <Text style={styleSheet.paragraph}>
              If you have a computer ready to manage, click the plus button at the top of the screen
              to connect the account to this device.
            </Text>
            <Text style={styleSheet.paragraph}>
              Once your first account is connected, you will be able to switch between accounts with the
              menu button at the top of the screen.
            </Text>
          </>
        }
      </View>
    </ScrollView>
  );
}
