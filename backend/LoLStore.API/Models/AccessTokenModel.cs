using LoLStore.API.Models.UserModel;

namespace LoLStore.API.Models;

public class AccessTokenModel
{
    public string Token {get;set;}
    public string TokenType {get;set;} = "bearer";
    public DateTime ExpiresToken {get;set;} = DateTime.UtcNow;
    public UserDto UserDto {get;set;}
}