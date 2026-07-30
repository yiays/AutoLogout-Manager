import { ApiError, OpenAPI, TimeLimitApiService } from "@/api-client";
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
  authorizeClient: (uuid: string, name: string, password: string) => Promise<ClientState | ApiError | null>;
  fetchClientState: (uuid: string, token: string) => Promise<ClientState | null>;
  pushClientState: (uuid: string, state:Partial<ClientState>, token:string) => Promise<boolean>;
};

OpenAPI.BASE = __DEV__? 'http://localhost:8111': 'https://autologout.yiays.com';
OpenAPI.HEADERS = async () => {
  return {
    'User-Agent': `AutoLogoutManager/${OpenAPI.VERSION} (AutoLogout-Manager ${Constants.expoConfig?.version}) (${Platform.OS} ${Platform.Version})`
  }
}
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

  // Fetch state from server and save locally
  const fetchClientState = async(uuid: string, token: string): Promise<ClientState | null> => {
    OpenAPI.TOKEN = token;
    try {
      const response = await TimeLimitApiService.getStateFetch(uuid);
      if (response) {
        await saveClientState(uuid, response);
        await setAccountState(uuid, NetworkState.Active);
        return response;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        if([404, 401].includes(error.status)) {
          Toast.show({
            type: 'error',
            text1: "UUID was removed or unauthorized",
            visibilityTime: 5
          });
          await setAccountState(uuid, NetworkState.Unauthorized);
        }else{
          Toast.show({
            type: 'error',
            text1: "Unhandled API error",
            visibilityTime: 5
          });
          console.error("Unhandled API error:", error.status, error.body);
          await setAccountState(uuid, NetworkState.NetworkError);
        }
      } else {
        Toast.show({
          type: 'error',
          text1:"Network Error",
          visibilityTime: 5
        });
        console.error("Failed to fetch client state:", error);
        await setAccountState(uuid, NetworkState.NetworkError);
      }
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
    TimeLimitApiService.getClientUpdateCheck().then(result =>
      setLatestVersion(result.version)
    ).catch(e => {
      console.error("Update check failed;", e);
    });
  }

  const pushClientState = async(uuid: string, state:Partial<ClientState>, token:string): Promise<boolean> => {
    OpenAPI.TOKEN = token;
    try {
      const response = await TimeLimitApiService.postStateSync(uuid, true, state);
      if (response.accepted) {
        await saveClientState(uuid, {...states[uuid], ...state, ...response.delta});
        await setAccountState(uuid, NetworkState.Active);
        Toast.show({
          type: 'success',
          text1:"Syncing successful",
          visibilityTime: 3
        });
        return true;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        if([404, 401].includes(error.status)) {
          Toast.show({
            type: 'error',
            text1: "UUID was removed or unauthorized",
            visibilityTime: 5
          });
          await setAccountState(uuid, NetworkState.Unauthorized);
        }else{
          Toast.show({
            type: 'error',
            text1: "Unhandled API error",
            visibilityTime: 5
          });
          console.error("Unhandled API error:", error.status, error.body);
          await setAccountState(uuid, NetworkState.NetworkError);
        }
      } else {
        Toast.show({
          type: 'error',
          text1:"Network Error",
          visibilityTime: 5
        });
        console.error("Failed to push new client state:", error);
        await setAccountState(uuid, NetworkState.NetworkError);
      }
    }
    return false;
  }

  const authorizeClient = async(uuid:string, name:string, password:string): Promise<ClientState | ApiError | null> => {
    OpenAPI.TOKEN = undefined;
    try {
      const response = await TimeLimitApiService.getClientAuthorize(uuid, password);
      console.log("Authorize response:", response);
      if(response.success) {
        await addAccount(uuid, name, response.authKey);
        const result = await fetchClientState(uuid, response.authKey);
        if(!result) return null; // This should never happen
        setStates(prev => ({ ...prev, [uuid]: result }));
        Toast.show({
          type: 'success',
          text1: "New account added successfully",
          visibilityTime: 5
        });
        return result;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        return error;
      } else {
        Toast.show({
          type: 'error',
          text1:"Network Error",
          visibilityTime: 5
        });
        console.error("Failed to authorize client:", error);
      }
    }
    return null;
  }

  useEffect(() => {
    loadAccounts(true);
  }, []);

  useEffect(() => {
    if(fetchOnce.current) return; // Prevent fetching multiple times
    if(!Object.keys(accounts).length) return; // No accounts yet
    fetchOnce.current = true;
    // Avoid fetching all if they already synced recently
    if(!recentSyncThresholdMet()) {
      fetchClients();
      fetchLatestVersion();
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