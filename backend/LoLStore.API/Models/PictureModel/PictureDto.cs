namespace LoLStore.API.Models.PictureModel;

public class PictureDto
{
	public Guid Id { get; set; }

	public Guid ProductId { get; set; }

	public string Path { get; set; } = string.Empty;

	public bool Active { get; set; }
}