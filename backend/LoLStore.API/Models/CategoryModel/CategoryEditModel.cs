namespace LoLStore.API.Models.CategoryModel;

public class CategoryEditModel
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool ShowOnMenu{ get; set; }
}