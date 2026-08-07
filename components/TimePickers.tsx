// Install dependencies if needed:
// npm install @react-native-picker/picker

import DropDownPicker from '@/components/DropDownPicker';
import { useThemeColor } from "@/hooks/useThemeStyle";
import { Switch, Text, View } from "react-native";

function TimePicker({
  value,
  onChange,
  enabled,
  zIndex = 1000
}: {
  value: { hour: number; minute: number };
  onChange: React.Dispatch<React.SetStateAction<{hour: number, minute: number} | false>>;
  enabled?: boolean;
  zIndex?: number;
}) {
  const styleSheet = useThemeColor();

  return (
    <View style={{...styleSheet.row, zIndex: zIndex}}>
      <DropDownPicker
        style={{width: 72}}
        enabled={typeof enabled == 'boolean' ? enabled : true}
        items={
          [...Array(24).keys()].map(h => ({label: `${(h<10?'0':'')+h}`, value: h}))
        }
        value={value.hour}
        onValueChange={(hour:number) => onChange(prev => (prev? { ...prev, hour }: {hour, minute:0}))}
      />
      <Text style={{...styleSheet.text, marginHorizontal:4}}>:</Text>
      <DropDownPicker
        style={{width: 72}}
        enabled={typeof enabled == 'boolean' ? enabled : true}
        items={
          [...Array(12).keys()].map(m => ({label: `${((m*5)<10?'0':'')+(m*5)}`, value: m*5}))
        }
        value={value.minute}
        onValueChange={(minute:number) => onChange(prev => (prev? { ...prev, minute }: {hour: 0, minute}))}
      />
    </View>
  )
}

export function HourMinutePicker({
  title,
  value,
  onChange,
  enabled,
  onEnableChange,
  zIndex = 1000
}: {
  title: string;
  value: { hour: number; minute: number };
  onChange: React.Dispatch<React.SetStateAction<{hour: number, minute: number} | false>>;
  enabled?: boolean;
  onEnableChange?: (val: boolean) => void;
  zIndex?: number;
}) {
  const styleSheet = useThemeColor();

  return (
    <View style={{...styleSheet.controlPanelPane, ...(enabled? styleSheet.activeBg: {})}}>
      <Text style={styleSheet.controlPanelHeader}>{title}</Text>
      { typeof onEnableChange == 'function' &&
        <Switch style={styleSheet.controlPanelSwitch} value={enabled} onValueChange={onEnableChange} />
      }
      { enabled !== false ? <>
        <TimePicker value={value} onChange={onChange} enabled={enabled} zIndex={zIndex}/>
      </>
      :
      <Text style={styleSheet.paragraph}>Unlimited</Text>
      }
    </View>
  );
}

export function TimeRangePicker({
  title,
  value,
  onStartChange,
  onEndChange,
  enabled,
  onEnableChange,
  zIndex = 1000
}: {
  title: string;
  value: {start: { hour: number; minute: number }, end: {hour: number, minute: number}};
  onStartChange: React.Dispatch<React.SetStateAction<{ hour: number; minute: number } | false>>;
  onEndChange: React.Dispatch<React.SetStateAction<{ hour: number; minute: number } | false>>;
  enabled?: boolean;
  onEnableChange?: (val: boolean) => void;
  zIndex?: number;
}) {
  const styleSheet = useThemeColor();

  return (
    <View style={{...styleSheet.controlPanelPane, ...(enabled? styleSheet.activeBg: {})}}>
      <Text style={styleSheet.controlPanelHeader}>{title}</Text>
      { typeof onEnableChange == 'function' &&
        <Switch style={styleSheet.controlPanelSwitch} value={enabled} onValueChange={onEnableChange} />
      }
      { enabled !== false ? <>
        <Text style={styleSheet.text}>From</Text>
        <TimePicker value={value.start} onChange={onStartChange} enabled={enabled} zIndex={zIndex}/>
        <Text style={styleSheet.text}>Until</Text>
        <TimePicker value={value.end} onChange={onEndChange} enabled={enabled} zIndex={zIndex+1}/>
      </>
      :
      <Text style={styleSheet.paragraph}>Unlimited</Text>
      }
    </View>
  );
}