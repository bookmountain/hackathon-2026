using Microsoft.EntityFrameworkCore;
using UniMap.Api.Domain;

namespace UniMap.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Degree> Degrees => Set<Degree>();
    public DbSet<FlatListing> FlatListings => Set<FlatListing>();
    public DbSet<MarketItem> MarketItems => Set<MarketItem>();
    public DbSet<MeetupEvent> MeetupEvents => Set<MeetupEvent>();
    public DbSet<EventAttendee> EventAttendees => Set<EventAttendee>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ConsentRecord> ConsentRecords => Set<ConsentRecord>();
    public DbSet<DailyDraw> DailyDraws => Set<DailyDraw>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasPostgresExtension("postgis");

        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(254);
            e.Property(u => u.University).HasConversion<string>().HasMaxLength(32);
            e.HasOne(u => u.Profile).WithOne(p => p.User).HasForeignKey<Profile>(p => p.UserId);
        });

        b.Entity<Profile>(e =>
        {
            e.HasKey(p => p.UserId);
            e.Property(p => p.DisplayName).HasMaxLength(64);
            e.Property(p => p.Department).HasMaxLength(128);
            e.Property(p => p.Bio).HasMaxLength(500);
            e.Property(p => p.Gender).HasConversion<string>().HasMaxLength(32);
            e.Property(p => p.Pronouns).HasMaxLength(32);
            e.Property(p => p.AgeRange).HasConversion<string>().HasMaxLength(16);
            e.Property(p => p.Nationality).HasMaxLength(2).IsFixedLength();
            e.Property(p => p.AvatarStyle).HasConversion<string>().HasMaxLength(16);
            e.Property(p => p.AvatarInitials).HasMaxLength(2);
            e.Property(p => p.AvatarIcon).HasConversion<string>().HasMaxLength(16);
            e.Property(p => p.AvatarShape).HasConversion<string>().HasMaxLength(16);
            e.Property(p => p.AvatarRing).HasConversion<string>().HasMaxLength(16);
            // GIN indexes make tag-overlap queries (&&) fast.
            e.HasIndex(p => p.Habits).HasMethod("gin");
            e.HasIndex(p => p.Interests).HasMethod("gin");
            e.HasOne(p => p.Degree).WithMany().HasForeignKey(p => p.DegreeId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Degree>(e =>
        {
            e.Property(d => d.University).HasConversion<string>().HasMaxLength(32);
            e.Property(d => d.Level).HasConversion<string>().HasMaxLength(16);
            e.Property(d => d.AwardType).HasMaxLength(64);
            e.Property(d => d.Name).HasMaxLength(200);
            e.Property(d => d.College).HasMaxLength(128);
            e.Property(d => d.Url).HasMaxLength(300);
            e.HasIndex(d => new { d.University, d.Level, d.Name }).IsUnique();
            e.HasIndex(d => new { d.University, d.Level, d.College });
        });

        b.Entity<FlatListing>(e =>
        {
            e.Property(f => f.Title).HasMaxLength(80);
            e.Property(f => f.Description).HasMaxLength(1000);
            e.Property(f => f.Suburb).HasMaxLength(64);
            e.Property(f => f.Street).HasMaxLength(64);
            e.Property(f => f.PreferredFlatmate).HasMaxLength(200);
            e.Property(f => f.Location).HasColumnType("geography (point, 4326)");
            e.Property(f => f.Toilet).HasConversion<string>().HasMaxLength(16);
            e.Property(f => f.Bathroom).HasConversion<string>().HasMaxLength(16);
            e.Property(f => f.Furnished).HasConversion<string>().HasMaxLength(16);
            e.Property(f => f.Status).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(f => f.Location).HasMethod("gist");
            e.HasIndex(f => new { f.Status, f.RentPerWeek });
            e.HasIndex(f => f.Features).HasMethod("gin");
            e.HasOne(f => f.Owner).WithMany().HasForeignKey(f => f.OwnerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MarketItem>(e =>
        {
            e.Property(i => i.Title).HasMaxLength(80);
            e.Property(i => i.Description).HasMaxLength(1000);
            e.Property(i => i.Category).HasConversion<string>().HasMaxLength(16);
            e.Property(i => i.Condition).HasConversion<string>().HasMaxLength(16);
            e.Property(i => i.ConditionNote).HasMaxLength(60);
            e.Property(i => i.Availability).HasConversion<string>().HasMaxLength(16);
            e.Property(i => i.PickupPointId).HasMaxLength(32);
            e.Property(i => i.PlaceName).HasMaxLength(64);
            e.Property(i => i.Location).HasColumnType("geography (point, 4326)");
            e.HasIndex(i => i.Location).HasMethod("gist");
            e.HasIndex(i => new { i.Availability, i.Category, i.CreatedAt });
            e.HasIndex(i => i.PickupPointId);
            e.HasOne(i => i.Seller).WithMany().HasForeignKey(i => i.SellerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MeetupEvent>(e =>
        {
            e.Property(m => m.Title).HasMaxLength(80);
            e.Property(m => m.Description).HasMaxLength(1000);
            e.Property(m => m.Type).HasConversion<string>().HasMaxLength(16);
            e.Property(m => m.PlaceId).HasMaxLength(32);
            e.Property(m => m.PlaceName).HasMaxLength(64);
            e.Property(m => m.Location).HasColumnType("geography (point, 4326)");
            e.HasIndex(m => m.Location).HasMethod("gist");
            e.HasIndex(m => m.StartsAt);
            e.HasIndex(m => m.HostId);
            e.HasOne(m => m.Host).WithMany().HasForeignKey(m => m.HostId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EventAttendee>(e =>
        {
            e.HasKey(a => new { a.EventId, a.UserId });
            e.HasIndex(a => a.UserId);
            e.HasOne(a => a.Event).WithMany(m => m.Attendees).HasForeignKey(a => a.EventId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Conversation>(e =>
        {
            e.HasIndex(c => new { c.UserAId, c.UserBId }).IsUnique();
            e.HasIndex(c => c.UserBId);
            e.HasOne(c => c.UserA).WithMany().HasForeignKey(c => c.UserAId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.UserB).WithMany().HasForeignKey(c => c.UserBId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ConsentRecord>(e =>
        {
            e.Property(c => c.Type).HasConversion<string>().HasMaxLength(32);
            e.Property(c => c.PolicyVersion).HasMaxLength(32);
            e.HasIndex(c => new { c.UserId, c.PolicyVersion, c.Type, c.CreatedAt });
            e.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<DailyDraw>(e =>
        {
            e.HasIndex(d => new { d.UserId, d.Day }).IsUnique();
            e.HasIndex(d => new { d.Day, d.DrawnAt });
            e.HasOne(d => d.User).WithMany().HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
            // Keep the other student's card (and their streak) when you delete your account
            e.HasOne(d => d.MatchedUser).WithMany().HasForeignKey(d => d.MatchedUserId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<ChatMessage>(e =>
        {
            e.Property(m => m.Body).HasMaxLength(2000);
            e.Property(m => m.Kind).HasConversion<string>().HasMaxLength(16);
            e.Property(m => m.AboutType).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(m => new { m.ConversationId, m.CreatedAt });
            e.HasOne(m => m.Conversation).WithMany().HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
