import { Image, type ImageProps, StyleSheet, View } from "react-native";

import { resolveMediaUrl } from "../lib/mediaUrl";

type Props = Omit<ImageProps, "source"> & {
  src: string | null | undefined;
};

export function AppMediaImage({ src, style, ...rest }: Props) {
  const uri = src ? resolveMediaUrl(src) : null;
  if (!uri) return <View style={[styles.ph, style]} />;
  return <Image source={{ uri }} style={style} resizeMode="cover" {...rest} />;
}

const styles = StyleSheet.create({
  ph: { backgroundColor: "#e2e8f0" },
});
