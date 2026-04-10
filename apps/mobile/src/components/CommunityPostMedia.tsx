import { ResizeMode, Video } from "expo-av";
import { StyleSheet, View } from "react-native";

import { AppMediaImage } from "./AppMediaImage";
import { resolveMediaUrl } from "../lib/mediaUrl";
import { theme } from "../theme";

type Props = {
  title: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  gifUrl?: string | null;
};

export function CommunityPostMedia({ title, imageUrl, videoUrl, gifUrl }: Props) {
  const videoUri = videoUrl ? resolveMediaUrl(videoUrl) : null;
  return (
    <View style={styles.wrap}>
      {imageUrl ? (
        <AppMediaImage
          src={imageUrl}
          style={styles.media}
          resizeMode="cover"
          accessibilityLabel={`Imagem do post: ${title}`}
        />
      ) : null}
      {gifUrl ? (
        <AppMediaImage
          src={gifUrl}
          style={styles.media}
          resizeMode="cover"
          accessibilityLabel={`GIF do post: ${title}`}
        />
      ) : null}
      {videoUri ? (
        <Video
          style={styles.video}
          source={{ uri: videoUri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space.sm, marginTop: theme.space.xs },
  media: {
    width: "100%",
    maxWidth: 280,
    height: 160,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  video: {
    width: "100%",
    maxWidth: 320,
    height: 200,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
