import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useRouter } from "expo-router";
import { Alert, Button, ToastAndroid } from "react-native";

export default function({uuid, name}: {uuid:string, name:string}) {
  const styleSheet = useThemeColor();
  const router = useRouter();
  const { removeClientState } = useAccounts();

  const handleRemove = async(): Promise<void> => {
    Alert.alert(
      "Remove account "+name,
      ("Are you sure you want to remove '"+name+"' from this device? "+
      "'"+name+"' will continue to work with any other connected devices."),
      [
        { text:'Ok', style:'destructive', onPress:async() => await removeClientState(uuid).then(cleanup) },
        { text:'Cancel', style:'cancel' }
      ]
    );
  }

  const cleanup = () => {
    ToastAndroid.show("Removed account successfully", 5);
    router.replace('/');
  }

  return (
    <Button color={styleSheet.dangerButton.backgroundColor} title="Remove account" onPress={handleRemove}/>
  )
}