import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

export default function() {
  const styleSheet = useThemeColor();
  const {accounts} = useAccounts();

  const allNames = Object.values(accounts).map(account => account.name);

  const [name, setName] = useState("");
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);
  const [uuidError, setUuidError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Validation functions
  function validateName(text: string) {
    setName(text);
    setNameError(allNames.includes(text) ? "Name must be unique." : text.length < 3 ? "Name must be at least 3 characters long." : null);
  }

  function validateUuid(text: string) {
    setUuid(text);
    setUuidError(!/^[0-9a-fA-F-]{36,37}$/.test(text) ? "Invalid UUID format." : null);
  }

  function validatePassword(text: string) {
    setPassword(text);
    setPasswordError(text.length < 1 ? "You must provide the parent password." : null);
  }

  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        <Text style={styleSheet.label}>Account name:</Text>
        <TextInput style={styleSheet.textInput}  onChangeText={validateName} textContentType="none" maxLength={50}></TextInput>
        { nameError && <Text style={styleSheet.validationNote}>{nameError}</Text> }

        <Text style={styleSheet.label}>Account UUID:</Text>
        <TextInput style={styleSheet.textInput}  onChangeText={validateUuid} textContentType="none" maxLength={37}></TextInput>
        { uuidError && <Text style={styleSheet.validationNote}>{uuidError}</Text> }

        <Text style={styleSheet.label}>Parent password:</Text>
        <TextInput style={styleSheet.textInput}  onChangeText={validatePassword} textContentType="none" secureTextEntry={true} maxLength={40}></TextInput>
        { passwordError && <Text style={styleSheet.validationNote}>{passwordError}</Text> }
        
        {/* <Button></Button> */}
      </View>
    </ScrollView>
  );
}