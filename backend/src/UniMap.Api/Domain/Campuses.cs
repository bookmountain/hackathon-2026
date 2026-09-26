namespace UniMap.Api.Domain;

public record Campus(string Id, string Name, University University, double Lat, double Lng);

/// <summary>
/// Campus coordinates from OpenStreetMap (Nominatim, 2026-09-26), used for walk times on listings.
/// </summary>
public static class Campuses
{
    public static readonly Campus[] All =
    [
        new("adelaide-city", "Adelaide Uni · City (North Tce)", University.Adelaide, -34.91888, 138.60448),
        new("adelaide-mawson-lakes", "Adelaide Uni · Mawson Lakes", University.Adelaide, -34.80880, 138.62013),
        new("adelaide-magill", "Adelaide Uni · Magill", University.Adelaide, -34.91004, 138.67440),
        new("flinders-city", "Flinders City Campus", University.Flinders, -34.92053, 138.59804),
        new("flinders-bedford-park", "Flinders · Bedford Park", University.Flinders, -35.02531, 138.57221),
        new("flinders-tonsley", "Flinders · Tonsley", University.Flinders, -35.00823, 138.57257),
    ];

    public static Campus? Find(string id) => All.FirstOrDefault(c => c.Id == id);

    // Walking: ~4.8 km/h, and streets add ~25% over a straight line.
    private const double MetresPerMinute = 80, StreetFactor = 1.25;

    public static int WalkMinutes(double lat, double lng, Campus c) =>
        (int)Math.Round(DistanceMetres(lat, lng, c.Lat, c.Lng) * StreetFactor / MetresPerMinute);

    /// <summary>Straight-line (haversine) distance.</summary>
    public static double DistanceMetres(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6_371_000;
        double Rad(double d) => d * Math.PI / 180;
        var dLat = Rad(lat2 - lat1);
        var dLng = Rad(lng2 - lng1);
        var a = Math.Pow(Math.Sin(dLat / 2), 2) + Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Pow(Math.Sin(dLng / 2), 2);
        return 2 * R * Math.Asin(Math.Sqrt(a));
    }
}
