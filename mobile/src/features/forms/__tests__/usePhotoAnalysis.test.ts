import { ApiError } from "@/api/client";
import { analysisFailure } from "../usePhotoAnalysis";

describe("analysisFailure", () => {
  it("says analysis is off, without Retry, when the API has no endpoint or no key", () => {
    for (const error of [new ApiError("Not found", 404), new ApiError("Off", 503, "ai_not_configured")]) {
      expect(analysisFailure(error)).toEqual({
        message: "AI photo analysis isn't switched on yet. Fill in the details yourself.",
        canRetry: false,
      });
    }
  });

  it("passes on why a photo can't be analysed, without Retry", () => {
    expect(analysisFailure(new ApiError("This photo can't be analysed. Try another one.", 422))).toEqual({
      message: "This photo can't be analysed. Try another one.",
      canRetry: false,
    });
  });

  it("offers Retry when the service is busy or the network failed", () => {
    for (const error of [new ApiError("Photo analysis is busy. Try again in a minute.", 503), new TypeError("Network request failed")]) {
      expect(analysisFailure(error)).toMatchObject({ canRetry: true });
    }
  });
});
