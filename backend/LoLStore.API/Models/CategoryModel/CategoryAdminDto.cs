namespace LoLStore.API.Models.CategoryModel;

public class CategoryAdminDto : CategoryDto
{
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
