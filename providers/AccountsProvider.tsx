import { ApiError, DefaultService, OpenAPI } from "@/api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ToastAndroid } from "react-native";

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
  graceGiven: boolean;
  syncAuthor?: string | null;
};

type States = {
  [uuid: string]: ClientState;
}

type AccountsContextType = {
  accounts: Accounts;
  states: States;
  removeClientState: (uuid: string) => Promise<void>;
  authorizeClient: (uuid: string, name: string, password: string) => Promise<ClientState | ApiError | null>;
  fetchClientState: (uuid: string, token: string) => Promise<ClientState | null>;
  pushClientState: (uuid: string, state:Partial<ClientState>, token:string) => Promise<boolean>;
};

OpenAPI.BASE = 'https://autologout.yiays.com';
const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Accounts>({});
  const [states, setStates] = useState<States>({});
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
      const response = await DefaultService.getStateFetch(uuid);
      if (response) {
        await saveClientState(uuid, response);
        await setAccountState(uuid, NetworkState.Active);
        return response;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        if([404, 401].includes(error.status)) {
          ToastAndroid.show("UUID was removed or unauthorized", 5);
          await setAccountState(uuid, NetworkState.Unauthorized);
        }else{
          ToastAndroid.show("Unhandled API error", 5);
          console.error("Unhandled API error:", error.status, error.body);
          await setAccountState(uuid, NetworkState.NetworkError);
        }
      } else {
        ToastAndroid.show("Network Error", 5);
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

  const pushClientState = async(uuid: string, state:Partial<ClientState>, token:string): Promise<boolean> => {
    OpenAPI.TOKEN = token;
    try {
      const response = await DefaultService.postStateSync(uuid, true, state);
      if (response.accepted) {
        await saveClientState(uuid, {...states[uuid], ...state, ...response.delta});
        await setAccountState(uuid, NetworkState.Active);
        ToastAndroid.show("Syncing successful", 3);
        return true;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        if([404, 401].includes(error.status)) {
          ToastAndroid.show("UUID was removed or unauthorized", 5);
          await setAccountState(uuid, NetworkState.Unauthorized);
        }else{
          ToastAndroid.show("Unhandled API error", 5);
          console.error("Unhandled API error:", error.status, error.body);
          await setAccountState(uuid, NetworkState.NetworkError);
        }
      } else {
        ToastAndroid.show("Network Error", 5);
        console.error("Failed to push new client state:", error);
        await setAccountState(uuid, NetworkState.NetworkError);
      }
    }
    return false;
  }

  const authorizeClient = async(uuid:string, name:string, password:string): Promise<ClientState | ApiError | null> => {
    OpenAPI.TOKEN = undefined;
    try {
      const response = await DefaultService.getClientAuthorize(uuid, password);
      console.log("Authorize response:", response);
      if(response.success) {
        await addAccount(uuid, name, response.authKey);
        const result = await fetchClientState(uuid, response.authKey);
        if(!result) return null; // This should never happen
        setStates(prev => ({ ...prev, [uuid]: result }));
        ToastAndroid.show("New account added successfully", 5);
        return result;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        return error;
      } else {
        ToastAndroid.show("Network Error", 5);
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
    if(!recentSyncThresholdMet())
      fetchClients();
  }, [accounts]);

  return (
    <AccountsContext.Provider
      value={{accounts, states, removeClientState, authorizeClient, fetchClientState, pushClientState}}
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