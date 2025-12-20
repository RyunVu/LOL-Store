using LoLStore.API.Models.UserModel;

namespace LoLStore.API.Models;

public class AccessTokenModel
{
    public string Token {get;set;} = string.Empty;
    public string TokenType {get;set;} = "bearer";
    public DateTime ExpiresToken {get;set;} = DateTime.UtcNow;
    public UserDto? UserDto {get;set;}
}