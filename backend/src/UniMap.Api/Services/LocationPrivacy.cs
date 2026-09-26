namespace UniMap.Api.Services;

public static class LocationPrivacy
{
    /// <summary>~110 m. Enough for "which block", not "which house". Used for pins other people dropped.</summary>
    public static double Blur(double v) => Math.Round(v, 3);
}
