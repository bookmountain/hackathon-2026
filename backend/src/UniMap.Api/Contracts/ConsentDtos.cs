using UniMap.Api.Domain;

namespace UniMap.Api.Contracts;

/// <param name="At">When this answer was given; null if never answered.</param>
public record ConsentItem(ConsentType Type, string Label, bool Required, bool Granted, DateTimeOffset? At);

/// <param name="Complete">All required consents granted. Until then, most endpoints return 403 consent_required.</param>
public record ConsentStatus(string PolicyVersion, bool Complete, List<ConsentItem> Items);

/// <summary>Only the fields you send are recorded. Send false to withdraw.</summary>
public record UpdateConsentsRequest(bool? Terms, bool? Location, bool? AgeAndEnrolment, bool? UsageStats);
