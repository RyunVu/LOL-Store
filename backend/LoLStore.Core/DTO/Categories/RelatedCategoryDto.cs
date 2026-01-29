namespace LoLStore.Core.DTO.Categories;

public class RelatedCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string UrlSlug { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}
