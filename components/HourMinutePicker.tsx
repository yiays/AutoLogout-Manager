// Install dependencies if needed:
// npm install @react-native-picker/picker

import DropDownPicker from '@/components/DropDownPicker';
import { useThemeColor } from "@/hooks/useThemeStyle";
import { Switch, Text, View } from "react-native";

export function HourMinutePicker({
  value,
  onChange,
  enabled,
  onEnableChange,
  zIndex = 1000
}: {
  value: { hour: number; minute: number };
  onChange: (val: { hour: number; minute: number }) => void;
  enabled?: boolean;
  onEnableChange?: (val: boolean) => void;
  zIndex?: number;
}) {
  const styleSheet = useThemeColor();

  return (
    <View style={{zIndex: zIndex, marginTop:8}}>
      { typeof onEnableChange == 'function' &&
        <View style={styleSheet.row}>
          <Switch value={enabled} onValueChange={onEnableChange} />
          <Text style={{...styleSheet.text, marginHorizontal:4}}>{enabled ? "Enabled" : "Disabled"}</Text>
        </View>
      }
      { enabled !== false ? <>
        <View style={styleSheet.row}>
          <DropDownPicker
            style={{width: 80}}
            enabled={typeof enabled == 'boolean' ? enabled : true}
            items={
              [...Array(24).keys()].map(h => ({label: `${(h<10?'0':'')+h}`, value: h}))
            }
            value={value.hour}
            onValueChange={hour => onChange({ ...value, hour })}
          />
          <Text style={{...styleSheet.text, marginHorizontal:4}}>:</Text>
          <DropDownPicker
            style={{width: 80}}
            enabled={typeof enabled == 'boolean' ? enabled : true}
            items={
              [...Array(12).keys()].map(m => ({label: `${((m*5)<10?'0':'')+(m*5)}`, value: m*5}))
            }
            value={value.minute}
            onValueChange={minute => onChange({ ...value, minute })}
          />
        </View>
      </>
      :
      <Text style={styleSheet.text}>Unlimited</Text>
      }
    </View>
  );
}