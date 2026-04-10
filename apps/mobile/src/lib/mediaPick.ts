import * as DocumentPicker from "expo-document-picker";
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import type { MediaUploadFile } from "./api";

const WORK_EXT = ["pdf", "doc", "docx", "txt"] as const;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

function permissionDenied(kind: string) {
  Alert.alert(
    "Permissão negada",
    `Autorize o acesso ${kind} nas configurações do dispositivo para enviar arquivos.`,
  );
}

export async function pickImageForUpload(): Promise<MediaUploadFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    permissionDenied("à galeria de fotos");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  const name = a.fileName ?? "imagem.jpg";
  const type = a.mimeType ?? "image/jpeg";
  return { uri: a.uri, name, type };
}

export async function pickGifForUpload(): Promise<MediaUploadFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "image/gif",
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const name = asset.name;
  if (!name.toLowerCase().endsWith(".gif")) {
    Alert.alert("Arquivo inválido", "Selecione um arquivo GIF.");
    return null;
  }
  return { uri: asset.uri, name, type: "image/gif" };
}

export async function pickVideoForUpload(): Promise<MediaUploadFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    permissionDenied("à galeria de vídeos");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  const name = a.fileName ?? "video.mp4";
  const type = a.mimeType ?? "video/mp4";
  return { uri: a.uri, name, type };
}

export async function pickWorkSubmissionFile(): Promise<{
  fileName: string;
  fileUrl: string;
  fileType: string;
} | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const fileName = asset.name;
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!WORK_EXT.includes(extension as (typeof WORK_EXT)[number])) {
    Alert.alert("Arquivo inválido", "Use apenas pdf, doc, docx ou txt.");
    return null;
  }
  const mime = MIME_BY_EXT[extension] ?? "application/octet-stream";
  try {
    const base64 = await readAsStringAsync(asset.uri, {
      encoding: EncodingType.Base64,
    });
    const fileUrl = `data:${mime};base64,${base64}`;
    return { fileName, fileUrl, fileType: extension };
  } catch {
    Alert.alert("Erro", "Não foi possível ler o arquivo selecionado.");
    return null;
  }
}
