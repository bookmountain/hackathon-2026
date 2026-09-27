import { geocodeQuery, geocodeUrl, shortName, toResult } from "../geocode";

describe("geocodeQuery", () => {
  it("needs 4 characters and adds Adelaide unless a place is named", () => {
    expect(geocodeQuery(" 25 ")).toBeNull();
    expect(geocodeQuery("25 Frome St")).toBe("25 Frome St, Adelaide SA");
    expect(geocodeQuery("Frome St, Adelaide")).toBe("Frome St, Adelaide");
    expect(geocodeQuery("10 King William St SA")).toBe("10 King William St SA");
    expect(geocodeQuery("Norwood 5067")).toBe("Norwood 5067");
    expect(geocodeQuery("Glenelg, South Australia")).toBe("Glenelg, South Australia");
  });
});

describe("geocodeUrl", () => {
  it("asks Nominatim for up to 4 matches around the CBD", () => {
    const url = geocodeUrl("25 Frome St, Adelaide SA");
    expect(url).toContain("limit=4");
    expect(url).toContain("countrycodes=au");
    expect(url).toContain("viewbox=138.50,-34.85,138.72,-35.00");
    expect(url).toContain("q=25%20Frome%20St%2C%20Adelaide%20SA");
  });
});

describe("shortName / toResult", () => {
  const place = {
    lat: "-34.9211",
    lon: "138.6072",
    display_name: "25, Frome Street, Adelaide, Adelaide City Council, South Australia, 5000, Australia",
    address: { house_number: "25", road: "Frome Street", suburb: "Adelaide", city: "Adelaide City Council" },
  };

  it("keeps the first four parts of the address", () => {
    expect(shortName(place.display_name)).toBe("25, Frome Street, Adelaide, Adelaide City Council");
  });

  it("maps a Nominatim place to a pin with street and suburb", () => {
    expect(toResult(place)).toEqual({
      latitude: -34.9211,
      longitude: 138.6072,
      name: "25, Frome Street, Adelaide, Adelaide City Council",
      street: "25 Frome Street",
      suburb: "Adelaide",
    });
    expect(toResult({ ...place, address: undefined })).toMatchObject({ street: null, suburb: null });
  });
});
