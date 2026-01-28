namespace LoLStore.Core.Contracts;

public abstract class BaseEntity : IEntity
{
    public Guid Id { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
