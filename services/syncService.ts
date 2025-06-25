import { DefaultService, OpenAPI } from "@/api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Account = {
  name: string;
  authKey: string;
};

export type Accounts = {
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

export async function getAccounts(): Promise<Accounts> {
  const rawAccounts = await AsyncStorage.getItem('accounts');
  const accounts: Accounts = rawAccounts? JSON.parse(rawAccounts): {};
  return accounts;
}

// Add a new client, after passing authorization checks
async function createClientState(uuid: string, name: string, authKey:string): Promise<void> {
  const accounts = await getAccounts();
  accounts[uuid] = {name: name, authKey: authKey};
  await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
}

// Save state for a UUID
async function saveClientState(uuid: string, state: ClientState): Promise<void> {
  await AsyncStorage.setItem('uuid-'+uuid, JSON.stringify(state));
}

// Load state for a UUID
export async function loadClientState(uuid: string): Promise<ClientState | null> {
  const value = await AsyncStorage.getItem('uuid-'+uuid);
  return value ? JSON.parse(value) : null;
}

export async function removeClientState(uuid:string) {
  const accounts = await getAccounts();
  delete accounts[uuid];
  await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
  await AsyncStorage.removeItem('uuid-'+uuid);
}

// Fetch state from server and save locally
export async function getClientState(uuid: string, token: string): Promise<ClientState | null> {
  OpenAPI.TOKEN = token;
  const response = await DefaultService.getStateFetch(uuid);
  if (response) {
    await saveClientState(uuid, response);
    return response;
  }
  return null;
}

export async function setClientState(uuid: string, state:ClientState, token:string): Promise<void> {
  OpenAPI.TOKEN = token;
  const response = await DefaultService.postStateSync(uuid, true, state);
  if (response.accepted) {
    await saveClientState(uuid, {...state, ...response.delta});
  }
}

export async function authorizeNewClient(uuid:string, name:string, password:string): Promise<ClientState | null> {
  OpenAPI.TOKEN = undefined;
  const response = await DefaultService.getClientAuthorize(uuid, password);
  if(response.success) {
    await createClientState(uuid, name, response.authKey);
    return await getClientState(uuid, response.authKey);
  }
  return null;
}