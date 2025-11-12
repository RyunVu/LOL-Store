
namespace LoLStore.Core.Collections;

public class RefreshToken : IRefreshToken
{
    public string Token { get; set; } = string.Empty;
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public DateTime Expires { get; set; }
}