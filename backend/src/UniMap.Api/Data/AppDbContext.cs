using Microsoft.EntityFrameworkCore;
using UniMap.Api.Domain;

namespace UniMap.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<BuddyConnection> BuddyConnections => Set<BuddyConnection>();

    protected override void OnModelCreating(ModelBuilder b)
    {
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
        });

        b.Entity<BuddyConnection>(e =>
        {
            e.Property(c => c.Status).HasConversion<string>().HasMaxLength(16);
            e.HasIndex(c => new { c.RequesterId, c.AddresseeId }).IsUnique();
            e.HasOne(c => c.Requester).WithMany().HasForeignKey(c => c.RequesterId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.Addressee).WithMany().HasForeignKey(c => c.AddresseeId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
