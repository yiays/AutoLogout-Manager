import { useEffect, useState } from "react";
import { Platform } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";


export default function picker(
  {style = {}, enabled = true, items, value: defaultValue, onValueChange}: {
    style?: object,
    enabled?: boolean,
    items: {label: string, value: any}[],
    value: any,
    onValueChange: (val: any) => void
  }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setOpen(prev => enabled? prev: false);
  }, [enabled]);

  const valueChanged = (val:any) => {
    setValue(val);
    onValueChange(val);
  }

  return (
    <DropDownPicker
      containerStyle={style}
      style={style}
      disabled={!enabled}
      open={enabled && open}
      setOpen={setOpen}
      value={value}
      setValue={valueChanged}
      items={items}
      listMode={Platform.OS == 'android'? 'MODAL': 'SCROLLVIEW'}
    />
  )
}