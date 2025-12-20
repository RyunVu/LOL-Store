namespace LoLStore.Core.DTO;

public class CategoryItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UrlSlug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool ShowOnMenu { get; set; }
    public bool IsDeleted { get; set; }
    public int ProductCount { get; set; }
}