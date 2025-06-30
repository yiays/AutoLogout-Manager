import { ApiError, DefaultService, OpenAPI } from "@/api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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
};

type Accounts = {
  [uuid: string]: Account;
};

type ClientState = {
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
  authorizeClient: (uuid: string, name: string, password: string) => Promise<ClientState | null>;
};

OpenAPI.BASE = 'https://timelimit.yiays.com';
const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Accounts>({});
  const [states, setStates] = useState<States>({});

  const loadAccounts = async(coldstart: boolean = false): Promise<Accounts> => {
    const rawAccounts = await AsyncStorage.getItem('accounts');
    const newAccounts: Accounts = rawAccounts? JSON.parse(rawAccounts): {};
    if(coldstart) {
      // Accounts have not synced yet, reflect that in state
      for (const uuid in newAccounts) {
        newAccounts[uuid].state = NetworkState.Unknown;
      }
    }
    setAccounts(newAccounts);
    return newAccounts;
  }

  const setAccountState = async(uuid: string, state: NetworkState): Promise<void> => {
    accounts[uuid].state = state;
    await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
    setAccounts(prev => ({ ...prev, [uuid]: { ...prev[uuid], state } }));
  }

  // Add a new client, after passing authorization checks
  const addAccount = async(uuid: string, name: string, authKey:string): Promise<void> => {
    accounts[uuid] = { name: name, authKey: authKey, state: NetworkState.Unknown };
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
  const getClientState = async(uuid: string, token: string): Promise<ClientState | null> => {
    OpenAPI.TOKEN = token;
    try {
      const response = await DefaultService.getStateFetch(uuid);
      console.log("Fetch response:", response);
      if (response) {
        await saveClientState(uuid, response);
        await setAccountState(uuid, NetworkState.Active);
        return response;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        if([404, 401].includes(error.status)) {
          console.error("UUID was removed or unauthorized:", uuid);
          await setAccountState(uuid, NetworkState.Unauthorized);
        }else{
          console.error("Unhandled API error:", error.status, error.body);
          await setAccountState(uuid, NetworkState.NetworkError);
        }
      }
    }
    return null;
  }

  const setClientState = async(uuid: string, state:ClientState, token:string): Promise<void> => {
    OpenAPI.TOKEN = token;
    try {
      const response = await DefaultService.postStateSync(uuid, true, state);
      if (response.accepted) {
        await saveClientState(uuid, {...state, ...response.delta});
      }
    } catch (error) {
      if(error instanceof ApiError) {
        if([404, 401].includes(error.status)) {
          console.error("UUID was removed or unauthorized:", uuid);
          removeClientState(uuid);
        }else{
          console.error("Unhandled API error:", error.status, error.body);
        }
      } else {
        console.error("Failed to set client state:", error);
      }
    }
  }

  const authorizeClient = async(uuid:string, name:string, password:string): Promise<ClientState | null> => {
    OpenAPI.TOKEN = undefined;
    try {
      const response = await DefaultService.getClientAuthorize(uuid, password);
      console.log("Authorize response:", response);
      if(response.success) {
        await addAccount(uuid, name, response.authKey);
        const result = await getClientState(uuid, response.authKey);
        if(!result) return null; // This should never happen
        setStates(prev => ({ ...prev, [uuid]: result }));
        return result;
      }
    } catch (error) {
      if(error instanceof ApiError) {
        console.error("Unhandled API error:", error.status, error.body);
      } else {
        console.error("Failed to set client state:", error);
      }
    }
    return null;
  }

  const refreshAccounts = async () => {
    await loadAccounts(true);
    Object.entries(accounts).forEach(async ([uuid, account]) => {
      const newState = await getClientState(uuid, account.authKey);
      if (newState) setStates({...states, newState});
    });
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  return (
    <AccountsContext.Provider value={{ accounts, states, authorizeClient }}>
      {children}
    </AccountsContext.Provider>
  );
};

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) throw new Error("useAccounts must be used within an AccountsProvider");
  return context;
}