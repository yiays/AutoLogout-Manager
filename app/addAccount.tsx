import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";

const prefilledParams: {name?: string, uuid?: string, password?: string} = {};

export default function() {
  const styleSheet = useThemeColor();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { accounts, authorizeClient } = useAccounts();

  const allNames = Object.values(accounts).map(account => account.name);

  const [name, setName] = useState("");
  const [uuid, setUuid] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);
  const [uuidError, setUuidError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  useEffect(() => {
    // Restore pre-filled values after clearing the params
    if(params.name || params.uuid || params.password) return;
    
      if (prefilledParams.name) {
      validateName(prefilledParams.name);
      prefilledParams.name = undefined;
    }
    if (prefilledParams.uuid) {
      validateUuid(prefilledParams.uuid);
      prefilledParams.uuid = undefined;
    }
    if (prefilledParams.password) {
      validatePassword(prefilledParams.password);
      prefilledParams.password = undefined;
    }
  }, [router]);

  useEffect(() => {
    // Pre-fill fields if query params exist
    if(!Object.keys(prefilledParams).length) {
      let didApply = false;
      if (params.name && typeof params.name === "string") {
        prefilledParams.name = params.name;
        didApply = true;
      }
      if (params.uuid && typeof params.uuid === "string") {
        prefilledParams.uuid = params.uuid;
        didApply = true;
      }
      if (params.password && typeof params.password === "string") {
        prefilledParams.password = params.password;
        didApply = true;
      }
      
      // Avoid re-applying params on back navigation
      if(didApply) setTimeout(() => router.replace('/addAccount'), 0);
    }
  }, [params]);

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

  async function handleSubmit() {
    setSubmitError(null);
    if (nameError || uuidError || passwordError) {
      // If there are validation errors, do not submit
      return;
    }
    if( !name || !uuid || !password) {
      // If any field is empty, do not submit
      setNameError(!name ? "Account name is required." : null);
      setUuidError(!uuid ? "Account UUID is required." : null);
      setPasswordError(!password ? "Parent password is required." : null);
      return;
    }

    const result = await authorizeClient(uuid, name, password);
    if (result) {
      console.log("Account created with", { name, uuid, password });

      // Reset fields after submission
    } else {
      setSubmitError("Failed to add account. Double-check your internet connection and try again.");
    }
  }

  return (
    <ScrollView style={styleSheet.view}>
      <View style={styleSheet.container}>
        <Text style={styleSheet.label}>Account name:</Text>
        <TextInput style={styleSheet.textInput} value={name} onChangeText={validateName} textContentType="none" maxLength={50}></TextInput>
        { nameError && <Text style={styleSheet.validationNote}>{nameError}</Text> }

        <Text style={styleSheet.label}>Account UUID:</Text>
        <TextInput style={styleSheet.textInput} value={uuid} onChangeText={validateUuid} textContentType="none" maxLength={37}></TextInput>
        { uuidError && <Text style={styleSheet.validationNote}>{uuidError}</Text> }

        <Text style={styleSheet.label}>Parent password:</Text>
        <TextInput style={styleSheet.textInput} value={password} onChangeText={validatePassword} textContentType="none" secureTextEntry={true} maxLength={40}></TextInput>
        { passwordError && <Text style={styleSheet.validationNote}>{passwordError}</Text> }
        
        <Button title="Add account" onPress={handleSubmit}/>
        { submitError && <Text style={styleSheet.errorNote}>{submitError}</Text> }
      </View>
    </ScrollView>
  );
}