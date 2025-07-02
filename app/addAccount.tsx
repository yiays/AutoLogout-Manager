import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";

export default function() {
  const styleSheet = useThemeColor();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { accounts, authorizeClient } = useAccounts();

  const allNames = Object.values(accounts).map(account => account.name);
  const allUuids = Object.keys(accounts);

  const [name, setName] = useState("");
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);
  const [uuidError, setUuidError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  useEffect(() => {
    // Restore pre-filled values after clearing the params
    if (typeof params.name == 'string') {
      validateName(params.name);
    }
    if (typeof params.uuid == 'string') {
      validateUuid(params.uuid);
    }
    if (typeof params.password == 'string') {
      validatePassword(params.password);
    }
  }, [params]);

  // Validation functions
  function validateName(text: string) {
    setName(text);
    setNameError(
      allNames.includes(text) ? "Name must be unique."
      : text.length < 3 ? "Name must be at least 3 characters long."
      : null
    );
  }

  function validateUuid(text: string) {
    setUuid(text);
    setUuidError(
      allUuids.includes(text) ? "This account has already been added."
      : !/^[0-9a-fA-F-]{36,37}$/.test(text) ? "Invalid UUID format."
      : null
    );
  }

  function validatePassword(text: string) {
    setPassword(text);
    setPasswordError(
      text.length < 1 ? "You must provide the parent password."
      : null
    );
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (nameError || uuidError || passwordError) {
      // If there are validation errors, do not submit
      setSubmitError("A required parameter is invalid. Please correct any issues.");
      return;
    }
    if( !name || !uuid || !password) {
      // If any field is empty, do not submit
      setNameError(!name ? "Account name is required." : null);
      setUuidError(!uuid ? "Account UUID is required." : null);
      setPasswordError(!password ? "Parent password is required." : null);

      setSubmitError("A required parameter is empty. Please fill in all fields.");
      return;
    }

    const result = await authorizeClient(uuid, name, password);
    if (result) {
      console.log("Account created with", { name, uuid, password });
      router.replace({ pathname: "/[uuid]", params: { uuid } });
    } else {
      setSubmitError("Failed to add account. Double-check your internet connection and try again.");
    }
  }

  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        {
        !params.uuid?<>
          <Text style={styleSheet.title}>How to add accounts</Text>
          <Text style={styleSheet.paragraph}>
            Open the control panel in AutoLogout, then click the "Connect to your phone" button.
            Scan the resulting QR code with your camera app or Google Lens.
          </Text>
          <Image
            style={{...styleSheet.spanImage, aspectRatio:0.883, maxHeight: 800}}
            source={require('@/assets/images/Connect to your phone.png')}
          />
        </>:<>
          <Text style={styleSheet.label}>Account name:</Text>
          <TextInput style={styleSheet.textInput} value={name} readOnly={Boolean(params.name)} onChangeText={validateName} textContentType="none" maxLength={50}></TextInput>
          { nameError && <Text style={styleSheet.validationNote}>{nameError}</Text> }

          <Text style={styleSheet.label}>Account UUID:</Text>
          <TextInput style={styleSheet.textInput} value={uuid} readOnly={true} onChangeText={validateUuid} textContentType="none" maxLength={37}></TextInput>
          { uuidError && <Text style={styleSheet.validationNote}>{uuidError}</Text> }

          <Text style={styleSheet.label}>Parent password:</Text>
          <Text style={styleSheet.note}>This is the password you entered when opening AutoLogout on this account for the first time.</Text>
          <TextInput style={styleSheet.textInput} value={password} readOnly={Boolean(params.password)} onChangeText={validatePassword} textContentType="none" secureTextEntry={true} maxLength={40}></TextInput>
          { passwordError && <Text style={styleSheet.validationNote}>{passwordError}</Text> }
          
          <Button title="Add account" onPress={handleSubmit}/>
          { submitError && <Text style={styleSheet.errorNote}>{submitError}</Text> }
        </>
        }
      </View>
    </ScrollView>
  );
}