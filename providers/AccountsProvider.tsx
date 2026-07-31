import * as TimeLimitApi from "@/src/client";
import { client } from '@/src/client/client.gen';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from 'react-native';
import Toast from "react-native-toast-message";

enum NetworkState {
  NetworkError = -2,
  Unauthorized = -1,
  Unknown = 0,
  Active = 1,
}

export type Account = {
  name: string;
  authKey: string;
  state: NetworkState;
  lastSync: number;
};

type Accounts = {
  [uuid: string]: Account;
};

export type ClientState = {
  dailyTimeLimit: number;
  todayTimeLimit: number;
  usedTime?: number;
  usageDate: string;
  bedtime: string;
  waketime: string;
  syncAuthor?: string | null;
  clientVersion?: string;
  clientOS?: string;
};

type States = {
  [uuid: string]: ClientState;
}

type AccountsContextType = {
  accounts: Accounts;
  states: States;
  latestVersion: string;
  removeClientState: (uuid: string) => Promise<void>;
  authorizeClient: (uuid: string, name: string, password: string) => Promise<ClientState | number | null>;
  fetchClientState: (uuid: string, token: string) => Promise<ClientState | null>;
  pushClientState: (uuid: string, state:Partial<ClientState>, token:string) => Promise<boolean>;
};

client.setConfig({
  baseUrl: (__DEV__? 'http://asriel-surface:8111': 'https://autologout.yiays.com'),
  headers: {
    'User-Agent': `AutoLogoutManager/${client} (AutoLogout-Manager ${Constants.expoConfig?.version}) (${Platform.OS} ${Platform.Version})`,
  }
});

/*client.interceptors.request.use((request) => {
  // Enforce a 5-second timeout (5000ms)
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  return new Request(request, {
    signal: controller.signal
  });
});*/

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Accounts>({});
  const [states, setStates] = useState<States>({});
  const [latestVersion, setLatestVersion] = useState('0.0.0');
  const fetchOnce = useRef(false);

  const recentSyncThresholdMet = (): boolean => {
    // Checks if the oldest sync is within the last 15 minutes
    return Math.min(...Object.values(accounts).map(a => a.lastSync)) > Date.now() - 15 * 60 * 1000;
  }

  const loadAccounts = async(coldstart: boolean = false): Promise<Accounts> => {
    const rawAccounts = await AsyncStorage.getItem('accounts');
    const newAccounts: Accounts = rawAccounts? JSON.parse(rawAccounts): {};
    if(coldstart) {
      // Accounts have not synced yet, reflect that in state
      for (const uuid in newAccounts) {
        newAccounts[uuid].state = NetworkState.Unknown;
        await loadClientState(uuid);
      }
    }
    setAccounts(newAccounts);
    return newAccounts;
  }

  const setAccountState = async(uuid: string, state: NetworkState): Promise<void> => {
    accounts[uuid].state = state;
    if(state == NetworkState.Active) accounts[uuid].lastSync = Date.now();
    await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
    setAccounts(prev => ({...prev, [uuid]: {
      ...prev[uuid],
      state,
      ...(state == NetworkState.Active? {lastSync: Date.now()}: {})
    }}));
  }

  // Add a new client, after passing authorization checks
  const addAccount = async(uuid: string, name: string, authKey:string): Promise<void> => {
    accounts[uuid] = { name: name, authKey: authKey, state: NetworkState.Unknown, lastSync: 0 };
    await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
    setAccounts(prev => ({ ...prev, [uuid]: { ...accounts[uuid] } }));
  }

  // Save state for a UUID
  const saveClientState = async(uuid: string, state: ClientState): Promise<void> => {
    await AsyncStorage.setItem('uuid-'+uuid, JSON.stringify(state));
    setStates(prev => ({ ...prev, [uuid]: state }));
  }

  // Load state for a UUID
  const loadClientState = async(uuid: string): Promise<ClientState | null> => {
    const value = await AsyncStorage.getItem('uuid-'+uuid);
    const state: ClientState | null = value? JSON.parse(value): null;
    if(state) {
      setStates(prev => ({ ...prev, [uuid]: state }));
      return state;
    }
    return null;
  }

  async function removeClientState(uuid:string) {
    delete accounts[uuid];
    await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
    await AsyncStorage.removeItem('uuid-'+uuid);
    setAccounts(prev => {
      delete prev[uuid];
      return prev;
    });
    setStates(prev => {
      delete prev[uuid];
      return prev;
    });
  }

  async function handleApiErrors (uuid:string, status?:number, error?:string) {
    if([404, 401].includes(status?? 0)) {
      Toast.show({
        type: 'error',
        text1: `${accounts[uuid].name}: You've been signed out`,
        visibilityTime: 5
      });
      await setAccountState(uuid, NetworkState.Unauthorized);
    }else{
      Toast.show({
        type: 'error',
        text1: `${accounts[uuid].name}: Unhandled API error, is this app up to date?`,
        visibilityTime: 5
      });
      console.error("Unhandled API error:", error);
      await setAccountState(uuid, NetworkState.NetworkError);
    }
  }

  // Fetch state from server and save locally
  const fetchClientState = async(uuid: string, token: string): Promise<ClientState | null> => {
    try {
      const result = await TimeLimitApi.getStateFetch({
        path: {uuid},
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (result.data) {
        await saveClientState(uuid, result.data);
        await setAccountState(uuid, NetworkState.Active);
        return result.data;
      } else {
        handleApiErrors(uuid, result.response?.status, result.error.error)
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1:`${accounts[uuid].name}: Network Error`,
        visibilityTime: 5
      });
      console.error("Failed to fetch client state:", error);
      await setAccountState(uuid, NetworkState.NetworkError);
    }
    return null;
  }

  const fetchClients = () => {
    console.log("Fetching client states for all accounts...");
    for (const [uuid, account] of Object.entries(accounts)) {
      fetchClientState(uuid, account.authKey).then(newState => {
        if (newState) setStates(prev => ({...prev, [uuid]: newState}));
      });
    };
  }

  const fetchLatestVersion = () => {
    console.log("Checking latest version of AutoLogout...");
    TimeLimitApi.getClientUpdateCheck().then(result => {
      if(result.data) {
        setLatestVersion(result.data.version);
        console.log("Latest version of AutoLogout is", result.data.version)
      }
      else console.error("Update check failed;", result.error);
    }).catch(e => {
      console.error("Update check failed;", e);
    });
  }

  const pushClientState = async(uuid: string, state:Partial<ClientState>, token:string): Promise<boolean> => {
    try {
      const result = await TimeLimitApi.postStateSync({
        path: {uuid},
        query: {parentMode: true},
        body: state
      });
      if(result.data) {
        if (result.data.accepted) {
          await saveClientState(uuid, {...states[uuid], ...state, ...result.data.delta});
          await setAccountState(uuid, NetworkState.Active);
          Toast.show({
            type: 'success',
            text1:`${accounts[uuid].name}: Syncing successful`,
            visibilityTime: 3
          });
          return true;
        }
      }else{
        handleApiErrors(uuid, result.response?.status, result.error.error)
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1:`${accounts[uuid].name}: Network Error`,
        visibilityTime: 5
      });
      console.error("Failed to push new client state:", error);
      await setAccountState(uuid, NetworkState.NetworkError);
    }
    return false;
  }

  const authorizeClient = async(uuid:string, name:string, password:string): Promise<ClientState | number | null> => {
    try {
      const result = await TimeLimitApi.getClientAuthorize({
        path: {uuid},
        query: {password}
      });
      if(result.data?.success) {
        await addAccount(uuid, name, result.data.authKey);
        const newClient = await fetchClientState(uuid, result.data.authKey);
        if(!newClient) return null; // This should never happen
        setStates(prev => ({ ...prev, [uuid]: newClient }));
        Toast.show({
          type: 'success',
          text1: "New account added successfully",
          visibilityTime: 5
        });
        return newClient;
      }else{
        return result.response?.status?? null;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: "Network Error",
        visibilityTime: 5
      });
      console.error("Failed to authorize client:", error);
    }
    return null;
  }

  useEffect(() => {
    loadAccounts(true);
  }, []);
  
  useEffect(() => {
    if(fetchOnce.current) return; // Prevent fetching multiple times
    if(!Object.keys(accounts).length) return; // No accounts yet
    if(latestVersion == '0.0.0') fetchLatestVersion();
    fetchOnce.current = true;
    // Avoid fetching all if they already synced recently
    if(!recentSyncThresholdMet()) {
      fetchClients();
    }
  }, [accounts]);

  return (
    <AccountsContext.Provider
      value={{accounts, states, latestVersion, removeClientState, authorizeClient, fetchClientState, pushClientState}}
    >
      {children}
    </AccountsContext.Provider>
  );
};

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) throw new Error("useAccounts must be used within an AccountsProvider");
  return context;
}