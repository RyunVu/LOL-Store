namespace LoLStore.API.Models.SupplierModel;

public class SupplierEditModel
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty; 
    public string Phone { get; set; } = string.Empty;
}   