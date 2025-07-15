import { HourMinutePicker } from "@/components/HourMinutePicker";
import ReAuthForm from "@/components/ReAuthForm";
import RemoveAccountButton, { useRemoveAccount } from "@/components/RemoveAccountButton";
import { useThemeColor } from "@/hooks/useThemeStyle";
import { ClientState, useAccounts } from "@/providers/AccountsProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Button, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { Menu } from 'react-native-paper';
import * as Progress from 'react-native-progress';

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

function clamp(value:number, min:number, max:number): number {
  return Math.min(Math.max(value, min), max);
};

export default function() {
  const navigation = useNavigation();
  const styleSheet = useThemeColor();
  const params: {uuid: string} = useLocalSearchParams();
  const {accounts, states, fetchClientState, pushClientState} = useAccounts();

  const account = accounts[params.uuid];
  const state = states[params.uuid];
  
  const [todayTimeLimit, setTodayTimeLimit] = useState<{hour:number, minute:number} | false>(false);
  const [dailyTimeLimit, setDailyTimeLimit] = useState<{hour:number, minute:number} | false>(false);
  const [wakeTime, setWakeTime] = useState<{hour:number, minute:number} | false>(false);
  const [bedTime, setBedTime] = useState<{hour:number, minute:number} | false>(false);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh  = async() => {
    setRefreshing(true);
    await fetchClientState(params.uuid, account.authKey);
    setRefreshing(false);
  }
  
  const [menuVisible, setMenuVisible] = useState(false);
  const handleRemove = useRemoveAccount(params.uuid, account?.name);

  useEffect(() => {
    // Variables which values should be updated when the account changes
    navigation.setOptions({
      title: "Account: " + account?.name,
      headerRight: () => 
        <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 8 }}>
          <TouchableOpacity onPress={onRefresh}>
            <MaterialIcons name="refresh" size={24} color={styleSheet.text.color} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MaterialIcons name="more-vert" size={24} color={styleSheet.text.color} />
          </TouchableOpacity>
        </View>
    });
  }, [account]);

  useEffect(() => {
    // Variables which values should be updated when the state changes
    if(state) {
      if(state.todayTimeLimit >= 0) {
        const safeHour = clamp(Math.floor(state.todayTimeLimit / 3600), 0, 23);
        const safeMinute = clamp(Math.ceil(state.todayTimeLimit / 60 % 60 / 5) * 5, 0, 55);
        setTodayTimeLimit({hour: safeHour, minute: safeMinute});
      }else{
        setTodayTimeLimit(false);
      }

      if(state.dailyTimeLimit >= 0) {
        const safeHour = clamp(Math.floor(state.dailyTimeLimit / 3600), 0, 23);
        const safeMinute = clamp(Math.ceil(state.dailyTimeLimit % 60 / 5) * 5, 0, 55);
        setDailyTimeLimit({hour: safeHour, minute: safeMinute});
      }else{
        setDailyTimeLimit(false);
      }
      
      if(state.waketime != state.bedtime) {
        {
          const parsedTime = Date.parse(`1970-01-01 ${state.waketime}Z`) / 1000;
          const safeHour = clamp(Math.floor(parsedTime / 3600), 0, 23);
          const safeMinute = clamp(Math.ceil(parsedTime % 60 / 5) * 5, 0, 55);
          setWakeTime({hour: safeHour, minute: safeMinute});
        }
        {
          const parsedTime = Date.parse(`1970-01-01 ${state.bedtime}Z`) / 1000;
          const safeHour = clamp(Math.floor(parsedTime / 3600), 0, 23);
          const safeMinute = clamp(Math.ceil(parsedTime % 60 / 5) * 5, 0, 55);
          setBedTime({hour: safeHour, minute: safeMinute});
        }
      }else{
        setWakeTime(false);
        setBedTime(false);
      }
    }
  }, [state]);

  function downtimeToggle(val:boolean) {
    if(val) {
      setBedTime({hour: 22, minute: 0});
      setWakeTime({hour: 8, minute: 0});
    }else{
      setBedTime(false);
      setWakeTime(false);
    }
  }

  const [lastSync, setLastSync] = useState('Never');
  useEffect(() => {
    let interval: number | undefined;
    if(account?.lastSync > 0) {
      setLastSync(timestampToRelativeTime(account.lastSync));
      interval = setInterval(() => setLastSync(timestampToRelativeTime(account.lastSync)), 1000);
    }else setLastSync('Never');
    return () => interval? clearInterval(interval): void 0;
  }, [account?.lastSync]);

  function usedTimeRatio(): number {
    const usedTime = (state.usedTime || 0);
    const totalTime = (state.todayTimeLimit == -1? 86400: state.todayTimeLimit);
    return clamp(usedTime / totalTime, 0, 1);
  }

  function newStateToClientState() : Partial<ClientState> {
    return {
      dailyTimeLimit: dailyTimeLimit? dailyTimeLimit.hour * 3600 + dailyTimeLimit.minute * 60: -1,
      todayTimeLimit: todayTimeLimit? todayTimeLimit.hour * 3600 + todayTimeLimit.minute * 60: -1,
      bedtime: (bedTime? `${bedTime.hour < 10? '0': ''}${bedTime.hour}:${bedTime.minute < 10? '0': ''}${bedTime.minute}`:'00:00') + ':00',
      waketime: (wakeTime? `${wakeTime.hour < 10? '0': ''}${wakeTime.hour}:${wakeTime.minute < 10? '0': ''}${wakeTime.minute}`:'00:00') + ':00',
    }
  }

  function syncCompare(): boolean {
    const a = JSON.stringify({...state, ...newStateToClientState()});
    const b = JSON.stringify(state);
    // if(a!=b) console.log('\n', a, '\n', b);
    return a != b;
  }

  async function handleSync() {
    const newState = newStateToClientState();
    console.log("Pushing state", newState);
    if(await pushClientState(params.uuid, newState, account.authKey))
      await onRefresh();
  }
  
  return <ScrollView style={styleSheet.view} refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
  }>
    <View style={styleSheet.menuContainer}>
      <Menu visible={menuVisible} onDismiss={() => setMenuVisible(false)} anchor={<View style={styleSheet.menuAnchor}/>}>
        <Menu.Item title="Remove account" onPress={() => handleRemove()}/>
      </Menu>
    </View>
    <View style={styleSheet.container}>
      {
      !account ? 
        <Text style={styleSheet.text}>Loading...</Text>
      :
      <>
        <MaterialIcons name="computer" size={128} color={styleSheet.tint.color} style={{marginTop: -24}}/>
        <Text style={styleSheet.title}>{account.name}</Text>
        <Text style={styleSheet.subtitle}>{params.uuid}</Text>
        <Text style={{...styleSheet.plainSubtitle, marginTop:0}}>Last sync: {lastSync}</Text>
        {
        account.state == -2 ?
          <>
            <Text style={styleSheet.errorNote}>Unable to sync account. Check your network connection.</Text>
            <RemoveAccountButton uuid={params.uuid} name={account.name}/>
          </>
        : account.state == -1 ?
          <>
            <Text style={styleSheet.errorNote}>You have been signed out of this account. Type in the password to sign in again.</Text>
            <ReAuthForm uuid={params.uuid}/>
          </>
        :
          <>
            <Text style={styleSheet.text}></Text>
            
            <Text style={styleSheet.label}>Last usage:</Text>
            <Text style={styleSheet.text}>{secondsToTime(state.usedTime?? 0)} (on {state.usageDate})</Text>
            <Progress.Bar width={300} progress={usedTimeRatio()} color={styleSheet.tint.color}/>

            <Text style={styleSheet.label}>Time limit (today):</Text>
            <HourMinutePicker
              value={typeof todayTimeLimit == 'object'? todayTimeLimit: {hour:0, minute:0}}
              onChange={setTodayTimeLimit}
              enabled={todayTimeLimit !== false}
              onEnableChange={(val) => setTodayTimeLimit(val? {hour:2, minute:0}: false)}
              zIndex={1004}
            />

            <Text style={styleSheet.label}>Time limit (daily):</Text>
            <HourMinutePicker
              value={typeof dailyTimeLimit == 'object'? dailyTimeLimit: {hour:0, minute:0}}
              onChange={setDailyTimeLimit}
              enabled={dailyTimeLimit !== false}
              onEnableChange={(val) => setDailyTimeLimit(val? {hour:2, minute:0}: false)}
              zIndex={1003}
            />

            <Text style={styleSheet.label}>Downtime:</Text>
            <View style={{...styleSheet.row, marginTop: 8}}>
              <Switch value={bedTime !== false} onValueChange={downtimeToggle}/>
              <Text style={{...styleSheet.text, marginHorizontal:4}}>{bedTime !== false ? "Enabled" : "Disabled"}</Text>
            </View>
            { wakeTime !== false ?
              <>
                <View style={{...styleSheet.row, zIndex:1002}}>
                  <Text style={{...styleSheet.text, marginRight: 4}}>From</Text>
                  <HourMinutePicker
                    value={typeof wakeTime == 'object'? wakeTime: {hour:0, minute:0}}
                    onChange={setWakeTime}
                  />
                </View>
                <View style={{...styleSheet.row, zIndex:1001}}>
                  <Text style={{...styleSheet.text, marginRight: 4}}>Until</Text>
                  <HourMinutePicker
                    value={typeof bedTime == 'object'? bedTime: {hour:0, minute:0}}
                    onChange={setBedTime}
                  />
                </View>
              </>
            :
              <Text style={styleSheet.paragraph}>No restrictions</Text>
            }

            {syncCompare() &&
              <Button title={"Push new settings to device"} onPress={handleSync}/>
            }
          </>
        }
      </>
      }
    </View>
  </ScrollView>
}