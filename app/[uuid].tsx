import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

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

function timestampToRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
}

export default function() {
  const navigation = useNavigation();
  const styleSheet = useThemeColor();
  const params: {uuid: string} = useLocalSearchParams();
  const {accounts, states, fetchClientState} = useAccounts();

  const account = accounts[params.uuid];
  const state = states[params.uuid];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh  = async() => {
    setRefreshing(true);
    await fetchClientState(params.uuid, account.authKey);
    setRefreshing(false);
  }
  
  useEffect(() => navigation.setOptions({title: "Account: " + account?.name}), [account]);

  const [lastSync, setLastSync] = useState('Never');
  useEffect(() => {
    let interval: number | undefined;
    if(account?.lastSync > 0) {
      setLastSync(timestampToRelativeTime(account.lastSync));
      interval = setInterval(() => setLastSync(timestampToRelativeTime(account.lastSync)), 1000);
    }else setLastSync('Never');
    return () => interval? clearInterval(interval): void 0;
  }, [account.lastSync]);
  
  return (
    <ScrollView style={styleSheet.view} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
    }>
      <View style={styleSheet.container}>
        {
        !account ? 
          <Text style={styleSheet.text}>Loading...</Text>
        :
        <>
          <Text style={styleSheet.title}>{account.name}</Text>
          <Text style={styleSheet.subtitle}>{params.uuid}</Text>
          <Text style={{...styleSheet.plainSubtitle, marginTop:0}}>Last sync: {lastSync}</Text>
          {
          account.lastSync > 0 && (Date.now() - account.lastSync) / 1000 > 60 ?
            <Text style={{...styleSheet.text, fontStyle: 'italic'}}>Pull down to refresh</Text>
          :
            <></>
          }
          {
          account.state == -2 ?
            <Text style={styleSheet.errorNote}>Unable to load account. Check your network connection.</Text>
          : account.state == -1 ?
            <Text style={styleSheet.errorNote}>You have been signed out of this account. Type in the password to sign in again.</Text>
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