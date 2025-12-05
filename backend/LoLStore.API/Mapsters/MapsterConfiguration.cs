using LoLStore.API.Models.CategoryModel;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.Entities;
using Mapster;

namespace LoLStore.API.Mapsters;

public class MapsterConfiguration : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Category, CategoryDto>()
            .Map(dest => dest.ProductCount,
              src => src.Products == null ? 0 : src.Products.Count);

        config.NewConfig<User, UserDto>()
            .AfterMapping((src, dest) =>
                {
                    if (src.Roles != null)
                    {
                        dest.Roles = src.Roles.Select(r => new RoleDto
                        {
                            Id = r.Id,
                            Name = r.Name
                        }).ToList();

                        dest.PrimaryRole =
                            src.Roles.Any(r => r.Name == "Admin") ? "Admin" :
                            src.Roles.Any(r => r.Name == "Manager") ? "Manager" :
                            "User";
                    }
                    else
                    {
                        dest.Roles = new List<RoleDto>();
                        dest.PrimaryRole = "User";
                    }
                });

    }
}