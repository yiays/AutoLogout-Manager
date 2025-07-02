import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";

export default function() {
  const navigation = useNavigation();
  const styleSheet = useThemeColor();
  const params: {uuid: string} = useLocalSearchParams();
  const { accounts, states } = useAccounts();
  const account = accounts[params.uuid];
  const state = states[params.uuid];
  
  useEffect(() => navigation.setOptions({title: "Account: " + account?.name}), [account]);
  
  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        {
        !account ? 
          <Text style={styleSheet.text}>Loading...</Text>
        :
        <>
          <Text style={styleSheet.title}>{account.name}</Text>
          <Text style={styleSheet.subtitle}>UUID: {params.uuid}</Text>
          {
          account.state == -2 ?
            <Text style={styleSheet.errorNote}>Unable to load account. Check your network connection.</Text>
          : account.state == -1 ?
            <Text style={styleSheet.errorNote}>You have been signed out of this account. Type in the password to sign in again.</Text>
          : account.state == 0 ?
            <Text style={styleSheet.errorNote}>This account hasn't finished loading. Please wait a moment.</Text>
          :
            <></>
          }
          </>
        }
      </View>
    </ScrollView>
  );
}