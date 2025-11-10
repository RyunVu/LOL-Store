using LoLStore.Core.Contracts;

namespace LoLStore.Core.Entities;

public class Role : IEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public IList<User> Users { get; set; }
}