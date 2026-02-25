using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LoLStore.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Data.Mappings;

public class AccountMap : IEntityTypeConfiguration<User>
{
	public void Configure(EntityTypeBuilder<User> builder)
	{
		builder.ToTable("Users");

		builder.HasKey(p => p.Id);

		builder.Property(p => p.Name)
			.IsRequired()
			.HasMaxLength(128)
			.HasDefaultValue("");

		builder.Property(p => p.Email)
			.IsRequired()
			.HasDefaultValue("");

		builder.Property(s => s.UserName)
			.IsRequired()
			.HasMaxLength(128);

		builder.Property(s => s.Password)
			.IsRequired()
			.HasMaxLength(512);

		builder.HasIndex(u => u.UserName)
            .IsUnique();

        builder.HasIndex(u => u.Email)
            .IsUnique();
		
		builder.Ignore(u => u.IsBanned);

		builder.HasMany(s => s.Roles)
			.WithMany(s => s.Users)
			.UsingEntity(pt => pt.ToTable("UserInRoles"));

		builder.HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
	}
}

public class RoleMap : IEntityTypeConfiguration<Role>
{
	public void Configure(EntityTypeBuilder<Role> builder)
	{
		builder.ToTable("Roles");

		builder.HasKey(p => p.Id);

		builder.Property(p => p.Name)
			.IsRequired()
			.HasMaxLength(128);
	}
}

public class UserRefreshTokenMap : IEntityTypeConfiguration<UserRefreshToken>
{
    public void Configure(EntityTypeBuilder<UserRefreshToken> builder)
    {
        builder.ToTable("UserRefreshTokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Token)
            .IsRequired()
            .HasMaxLength(512); // Avoid NVARCHAR(MAX)

        builder.Property(t => t.Created)
            .IsRequired();

        builder.Property(t => t.Expires)
            .IsRequired();

        // FK mapping is already handled in UserMap
        builder.HasOne(t => t.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UserId);
    }
}