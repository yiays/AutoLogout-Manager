import { StyleSheet } from "react-native";
import Colors from "./Colors";

export function baseStyles(theme: 'light'|'dark') {
  return StyleSheet.create({
    header: {
      backgroundColor: Colors[theme].background,
      color: Colors[theme].text,
    },
    view: {
      backgroundColor: Colors[theme].background,
    },
    container: {
      padding: 30,
    },
    title: {
      color: Colors[theme].text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    smallTitle: {
      color: Colors[theme].text,
      fontSize: 22,
      fontWeight: 'bold',
      marginVertical: 10,
    },
    subtitle: {
      color: Colors[theme].tint,
      fontSize: 14,
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginTop: -10,
    },
    text: {
      color: Colors[theme].text,
    },
    label: {
      color: Colors[theme].tint,
      fontSize: 11,
      textTransform: 'uppercase',
      fontWeight: 'bold',
    },
    paragraph: {
      color: Colors[theme].text,
      marginVertical: 8,
    },
    note: {
      color: Colors[theme].text,
      marginVertical: 8,
      fontStyle: 'italic',
    },
    textInput: {
      fontSize: 18,
      color: Colors[theme].text,
      borderWidth: 1,
      borderColor: Colors[theme].text,
      marginBlockStart: 4,
      marginBlockEnd: 12,
    },
    validationNote: {
      color: Colors[theme].danger,
      fontSize: 12,
      marginTop: -8,
      marginBottom: 8,
    },
    errorNote: {
      color: Colors[theme].danger,
      fontSize: 12,
      marginBottom: 8,
    },
    separator: {
      height: 1,
      width: '100%',
      marginVertical: 8,
    },
    link: {
      color: Colors[theme].text,
      padding: 14,
    },
    linkText: {
      color: Colors[theme].action,
      fontSize: 18,
    },
    dangerLinkText: {
      color: Colors[theme].danger,
      fontSize: 18,
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 32,
      marginBottom: 16,
      borderRadius: 4,
      elevation: 3,
      backgroundColor: Colors[theme].background,
      color: 'white'
    },
    buttonText: {
      color: 'white'
    },
    tint: {
      color: Colors[theme].tint,
    }
  });
}