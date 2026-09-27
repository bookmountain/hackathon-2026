import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import { errorMessage, isNotBuilt } from "@/api/client";
import * as api from "@/api/endpoints";
import { useToast } from "@/components/feedback/Toast";
import { toItem } from "@/data/adapters";
import type { Item, ItemCategory, Pickup } from "@/data/types";
import { categoryOfValue, guessCategory, rankByImage } from "./imageSearch";

export type ImageQuery = {
  /** Local URI of the picked photo, for the thumbnail */
  src: string;
  loading: boolean;
  category: ItemCategory | null;
  results: Item[];
};

/** How long the local fallback pretends to look, like the prototype */
const FALLBACK_DELAY_MS = 1600;
const MAX_SIDE = 640;

/** Downscaled JPEG as base64, the way POST /api/items/image-search takes it */
async function toBase64Jpeg(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82, base64: true });
  return saved.base64 ?? "";
}

/**
 * Market "Search by image": pick a photo, then ask the API for similar items. Until
 * the endpoint exists, guesses the category from the file name and ranks locally.
 */
export function useImageSearch(items: Item[], pickups: Pickup[]) {
  const toast = useToast();
  const [query, setQuery] = useState<ImageQuery | null>(null);
  // Only the latest search may update the state
  const run = useRef(0);

  const clear = useCallback(() => {
    run.current += 1;
    setQuery(null);
  }, []);

  /** Resolves true once a photo was picked (the caller then shows the results) */
  const start = useCallback(async (): Promise<boolean> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast("Allow photo access in Settings to search by image.");
      return false;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (picked.canceled || !picked.assets[0]) return false;
    const asset = picked.assets[0];
    const id = ++run.current;
    const name = asset.fileName ?? asset.uri.split("/").pop() ?? "";
    setQuery({ src: asset.uri, loading: true, category: null, results: [] });

    const finish = (category: ItemCategory | null, results: Item[]) => {
      if (run.current === id) setQuery({ src: asset.uri, loading: false, category, results });
    };
    try {
      const res = await api.imageSearch.items(await toBase64Jpeg(asset));
      finish(
        categoryOfValue(res.category),
        res.items.map((i) => toItem(i, pickups)),
      );
    } catch (e) {
      if (!isNotBuilt(e)) {
        if (run.current === id) setQuery(null);
        toast(errorMessage(e));
        return false;
      }
      const category = guessCategory(name);
      setTimeout(() => finish(category, rankByImage(items, category)), FALLBACK_DELAY_MS);
    }
    return true;
  }, [items, pickups, toast]);

  return { imageQuery: query, startImageSearch: start, clearImageSearch: clear };
}
