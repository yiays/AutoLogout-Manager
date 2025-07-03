import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} hour${h !== 1 ? 's' : ''}, and ${m} minute${m !== 1 ? 's' : ''}`;
}

function secondsToTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs / 60) % 60);
  const s = secs % 60;
  return `${h} hour${h !== 1 ? 's' : ''}, ${m} minute${m !== 1 ? 's' : ''}, and ${s} second${s != 1? 's': ''}`;
}

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
          <Text style={styleSheet.paragraph}></Text>
          <Text style={styleSheet.label}>Last usage:</Text>
          <Text style={styleSheet.text}>{minutesToTime(state.usedTime?? 0)} (on {state.usageDate})</Text>
          <Text style={styleSheet.label}>Time limit (today):</Text>
          <Text style={styleSheet.text}>{secondsToTime(state.todayTimeLimit)}</Text>
          <Text style={styleSheet.label}>Time limit (daily):</Text>
          <Text style={styleSheet.text}>{secondsToTime(state.dailyTimeLimit)}</Text>
          <Text style={styleSheet.label}>Downtime:</Text>
          <Text style={styleSheet.text}>
            {state.bedtime == state.waketime? 'No restrictions': `From ${state.bedtime} until ${state.waketime}`}
          </Text>
        </>
        }
      </View>
    </ScrollView>
  );
}