import { StyleSheet } from "react-native";
import Colors from "./Colors";

export function baseStyles(theme: 'light'|'dark') {
  return StyleSheet.create({
    header: {
      backgroundColor: Colors[theme].background,
    },
    view: {
      backgroundColor: Colors[theme].background,
    },
    container: {
      padding: 30,
    },
    panel: {
      margin: -30,
      padding: 30,
      marginBottom: 30,
    },
    controlPanel: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 16,
    },
    controlPanelPane: {
      width: 180,
      height: 180,
      padding: 10,
      backgroundColor: Colors[theme].background2,
      borderRadius: 16,
    },
    controlPanelHeader: {
      color: Colors[theme].text,
      fontSize: 11,
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginBottom: 8,
    },
    controlPanelSwitch: {
      position: 'absolute',
      top: 6,
      right: 6,
    },
    warningBg: {
      backgroundColor: Colors[theme].warning,
    },
    activeBg: {
      backgroundColor: Colors[theme].tint,
    },
    darkBgText: {
      color: Colors['dark'].text,
    },
    darkBgLink: {
      color: '#d6e6fe',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
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
    plainSubtitle: {
      color: Colors[theme].inactive,
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
      marginTop: 10,
    },
    spanImage: {
      width: '100%',
      maxHeight: 500,
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
      backgroundColor: Colors[theme].inactive,
      marginVertical: 8,
      opacity: 0.5,
    },
    navLabel: {
      color: Colors[theme].inactive,
      fontSize: 14,
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginLeft: 16,
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
      textAlign: 'center',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 4,
      elevation: 3,
      backgroundColor: Colors[theme].action,
      textTransform: 'uppercase',
      fontWeight: "500",
      color: 'white'
    },
    buttonText: {
      textAlign: 'center',
      textTransform: 'uppercase',
      fontWeight: "500",
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: Colors[theme].tint,
    },
    dangerButton: {
      backgroundColor: Colors[theme].danger,
    },
    tint: {
      color: Colors[theme].tint,
    },
    menuContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    menuAnchor: {
      width:1,
      height:1,
    }
  });
}