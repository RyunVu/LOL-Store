public interface IRefreshToken
{
    string Token { get; set; }
    DateTime Created { get; set; }
    DateTime Expires { get; set; }
}