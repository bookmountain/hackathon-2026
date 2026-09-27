import type { ItemPhotoAnalysis, RoomPhotoAnalysis } from "@/api/types";
import { itemAutofill, roomAutofill, toCategory, toCondition, toFurnishing } from "../aiAutofill";

const lamp: ItemPhotoAnalysis = {
  title: "White desk lamp",
  category: "Furniture",
  condition: "LikeNew",
  colour: "White",
  texture: "Matte metal",
  suggestedPrice: 14.6,
  description: "A bright desk lamp. Great for late study.",
  benefits: ["Bright light", "Small footprint", "Cheap", "Extra"],
};

describe("value mapping", () => {
  it("accepts API values or labels", () => {
    expect(toCategory("Study gear")).toBe("StudyGear");
    expect(toCategory("StudyGear")).toBe("StudyGear");
    expect(toCategory("Toys")).toBeNull();
    expect(toCondition("Like new")).toBe("LikeNew");
    expect(toFurnishing("Partly furnished")).toBe("Partly");
    expect(toFurnishing("Unfurnished")).toBe("Unfurnished");
  });
});

describe("itemAutofill", () => {
  const empty = { title: "", price: "", desc: "old", category: null, condition: null };

  it("fills an empty form and rewrites the description", () => {
    expect(itemAutofill(empty, lamp)).toEqual({
      title: "White desk lamp",
      price: "15",
      desc: "A bright desk lamp. Great for late study.\n\nColour: White · Texture: Matte metal · Condition: Like new\n• Bright light\n• Small footprint\n• Cheap",
      category: "Furniture",
      condition: "LikeNew",
    });
  });

  it("keeps a title and price the seller typed", () => {
    const patch = itemAutofill({ ...empty, title: "My lamp", price: "10" }, lamp);
    expect(patch.title).toBeUndefined();
    expect(patch.price).toBeUndefined();
  });
});

describe("roomAutofill", () => {
  const analysis: RoomPhotoAnalysis = {
    title: "Sunny room with desk",
    style: "Scandi",
    colours: "White, oak",
    furnished: "Fully",
    features: ["Desk", "Double bed", "Hot tub"],
    description: "Bright room.",
    benefits: ["Quiet"],
  };

  it("adds spotted features it knows and sets the furnishing", () => {
    expect(roomAutofill({ title: "", desc: "", feats: ["Desk", "Parking"], furnished: "Partly" }, analysis)).toEqual({
      title: "Sunny room with desk",
      desc: "Bright room.\n• Quiet",
      feats: ["Desk", "Parking", "Double bed"],
      furnished: "Fully",
    });
  });
});
