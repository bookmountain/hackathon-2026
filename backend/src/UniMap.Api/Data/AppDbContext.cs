using Microsoft.EntityFrameworkCore;
using UniMap.Api.Domain;

namespace UniMap.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Degree> Degrees => Set<Degree>();
    public DbSet<FlatListing> FlatListings => Set<FlatListing>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

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

        b.Entity<Conversation>(e =>
        {
            e.HasIndex(c => new { c.UserAId, c.UserBId }).IsUnique();
            e.HasIndex(c => c.UserBId);
            e.HasOne(c => c.UserA).WithMany().HasForeignKey(c => c.UserAId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.UserB).WithMany().HasForeignKey(c => c.UserBId).OnDelete(DeleteBehavior.Cascade);
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
