import { useThemeColor } from "@/hooks/useThemeStyle";
import { Href, Link } from "expo-router";
import { Button, Linking, Platform, Text } from "react-native";

export default function({url, label}: {url:string, label:string}) {
  const styleSheet = useThemeColor();

  return (
    Platform.OS == 'web' ?
      <Link style={styleSheet.button} href={url as Href} target="_blank">
        <Text style={styleSheet.buttonText}>{label}</Text>
      </Link>
    :
      <Button title={label} onPress={() => Linking.openURL(url)}/>
  )
}