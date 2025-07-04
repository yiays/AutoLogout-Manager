import { ApiError } from "@/api-client";
import { useThemeColor } from "@/hooks/useThemeStyle";
import { useAccounts } from "@/providers/AccountsProvider";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import RemoveAccountButton from "./RemoveAccountButton";

export default function({uuid}: {uuid: string}) {
  const styleSheet = useThemeColor();
  const { accounts, authorizeClient } = useAccounts();

  const name = accounts[uuid].name;
  const [password, setPassword] = useState("");
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validatePassword(text: string) {
    setPassword(text);
    setPasswordError(
      text.length < 1 ? "You must provide the parent password."
      : null
    );
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (passwordError) {
      // If there are validation errors, do not submit
      setSubmitError("A required parameter is invalid. Please correct any issues.");
      return;
    }
    if(!password) {
      // If any field is empty, do not submit
      setPasswordError(!password ? "Parent password is required." : null);

      setSubmitError("A required parameter is empty. Please fill in all fields.");
      return;
    }

    const result = await authorizeClient(uuid, name, password);
    if (result instanceof ApiError) {
      if(result.status == 401)
        setSubmitError("Incorrect password. Make sure you entered the password you set when opening AutoLogout on this account.");
      else if(result.status == 404)
        setSubmitError("Account not found. Make sure the computer is online. You may need to click 'Connect to your phone' again.");
      else
        setSubmitError("Server error. Please try again later.");
    } else if(result) {
      console.log("Account restored with new password", uuid);
    } else {
      setSubmitError("Failed reach server. Double-check your internet connection and try again.");
    }
  }

  return (<>
    <Text style={styleSheet.label}>Parent password:</Text>
    <Text style={styleSheet.note}>This is the password you entered when opening AutoLogout on this account for the first time.</Text>
    <TextInput style={styleSheet.textInput} value={password} onChangeText={validatePassword} textContentType="none" secureTextEntry={true} maxLength={40}></TextInput>
    { passwordError && <Text style={styleSheet.validationNote}>{passwordError}</Text> }

    <Button title="Restore account" onPress={handleSubmit}/>
    { submitError && <Text style={styleSheet.errorNote}>{submitError}</Text> }
    <View style={styleSheet.separator}/>
    <RemoveAccountButton uuid={uuid} name={name}/>
  </>);
}