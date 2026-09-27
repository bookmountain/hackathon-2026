// Pick photos from the library and upload them to R2 with presigned URLs.
// Flow (same for rooms and items): the first presign issues the listing/item id,
// later ones reuse it, then the create call sends the id and every key.
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ApiError } from "./client";
import type { PhotoUploadResponse } from "./types";

export type LocalPhoto = { uri: string; contentType: string };

/** The API takes JPEG, PNG or WebP; the picker re-encodes everything else to JPEG */
function contentTypeOf(asset: ImagePicker.ImagePickerAsset): string {
  const type = asset.mimeType ?? "";
  if (type === "image/png" || /\.png$/i.test(asset.uri)) return "image/png";
  if (type === "image/webp" || /\.webp$/i.test(asset.uri)) return "image/webp";
  return "image/jpeg";
}

/** Opens the photo library; resolves to [] when cancelled or permission is refused */
export async function pickPhotos(limit: number): Promise<LocalPhoto[]> {
  if (limit <= 0) return [];
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Allow photo access in Settings to add photos.");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    // Compressing also converts HEIC to JPEG on iOS
    quality: 0.7,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, limit).map((a) => ({ uri: a.uri, contentType: contentTypeOf(a) }));
}

async function put(url: string, photo: LocalPhoto) {
  const file = await (await fetch(photo.uri)).blob();
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": photo.contentType }, body: file });
  if (!res.ok) throw new ApiError(`Photo upload failed (${res.status}). Try again.`, res.status);
}

/**
 * Uploads photos in order (the first is the cover). `presign` asks the API for an
 * upload URL; `idOf` reads the listing/item id it issued.
 */
export async function uploadPhotos(
  photos: LocalPhoto[],
  presign: (contentType: string, id: string | null) => Promise<PhotoUploadResponse>,
  idOf: (res: PhotoUploadResponse) => string | undefined,
): Promise<{ id: string | null; keys: string[] }> {
  let id: string | null = null;
  const keys: string[] = [];
  for (const photo of photos) {
    const res = await presign(photo.contentType, id);
    id = idOf(res) ?? id;
    await put(res.uploadUrl, photo);
    keys.push(res.key);
  }
  return { id, keys };
}

/** Downloads a sample photo (the forms' "Use a demo photo") so it uploads like a picked one */
export async function downloadPhoto(url: string): Promise<LocalPhoto> {
  const target = new File(Paths.cache, `demo-${Date.now()}.jpg`);
  const file = await File.downloadFileAsync(url, target, { idempotent: true });
  return { uri: file.uri, contentType: "image/jpeg" };
}

/** Base64 JPEG, longest side at most `maxSide`, for photo analysis and image search */
export async function jpegBase64(uri: string, maxSide = 640, quality = 0.82): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(original.width, original.height) > maxSide) {
    context.resize(original.width >= original.height ? { width: maxSide } : { height: maxSide });
  }
  const image = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  if (!image.base64) throw new Error("Couldn't read the photo");
  return image.base64;
}
