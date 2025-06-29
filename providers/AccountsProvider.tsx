import { Accounts, authorizeNewClient, ClientState, getAccounts, getClientState } from "@/services/syncService";
import React, { createContext, useContext, useEffect, useState } from "react";

type States = {
  [uuid: string]: ClientState;
}

type AccountsContextType = {
  accounts: Accounts;
  states: States;
  addAccount: (uuid: string, name: string, password: string) => Promise<ClientState | null>;
};

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Accounts>({});
  const [states, setStates] = useState<States>({});

  const refreshAccounts = async () => {
    const data = await getAccounts();
    setAccounts(data);
    Object.entries(data).forEach(async ([uuid, account]) => {
      const newState = await getClientState(uuid, account.authKey);
      if (newState) setStates({...states, newState});
      else {
        console.warn("Resetting accounts state as an account was not found.");
        const data = await getAccounts();
        setAccounts(data);
      }
    });
  };

  const addAccount = async(uuid: string, name: string, password: string) => {
    const result = await authorizeNewClient(uuid, name, password);
    if(result) {
      setAccounts(await getAccounts());
      setStates(prev => ({ ...prev, [uuid]: result }));
      return result;
    }
    return null;
  }

  useEffect(() => {
    refreshAccounts();
  }, []);

  return (
    <AccountsContext.Provider value={{ accounts, states, addAccount }}>
      {children}
    </AccountsContext.Provider>
  );
};

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) throw new Error("useAccounts must be used within an AccountsProvider");
  return context;
}