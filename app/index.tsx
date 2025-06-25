import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { Account } from "@/services/syncService";
import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function Index() {
  const styleSheet = useThemeColor();
  const {accounts, states} = useAccounts();

  function renderAccount(value:[string, Account]) {
    const [uuid, account] = value;
    return (
      <Text style={styleSheet.title}>{account.name}</Text>
    )
  }
  
  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        { accounts && Object.keys(accounts).length?
            <>
              {Object.entries(accounts).map(renderAccount)}
            </>
          :
            <>
              <Text style={styleSheet.title}>Welcome to AutoLogout Manager</Text>
              <Text style={styleSheet.paragraph}>
                Remotely manage time limits and bedtime on Windows computers you manage.
                This is a companion app to the Windows app known as AutoLogout.
              </Text>
              <Text style={styleSheet.smallTitle}>Have you prepared the computers you want to manage?</Text>
              <Text style={styleSheet.paragraph}>
                Make sure you've installed and set up AutoLogout on any computers you want to manage.
              </Text>
              <Link style={styleSheet.linkText} href="https://github.com/yiays/AutoLogout">
                More about AutoLogout
              </Link>
              <Text style={styleSheet.smallTitle}>Next steps</Text>
              <Text style={styleSheet.paragraph}>
                If you have a computer ready to manage, click the plus button at the top of the screen
                to connect the account to this device.
              </Text>
              <Text style={styleSheet.paragraph}>
                Once your first account is connected, you will be able to switch between accounts at the
                top of the screen.
              </Text>
            </>
        }
      </View>
    </ScrollView>
  );
}
