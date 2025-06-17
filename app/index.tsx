import { useThemeColor } from "@/hooks/useThemeStyle";
import { ScrollView, Text, View } from "react-native";

export default function Index() {
  const styleSheet = useThemeColor();

  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        <Text style={styleSheet.text}>Edit app/index.tsx to edit this screen.</Text>
      </View>
    </ScrollView>
  );
}
