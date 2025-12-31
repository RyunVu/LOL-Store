using LoLStore.API.Models.CategoryModel;
using LoLStore.API.Models.OrderModel;
using LoLStore.API.Models.ProductHistoryModel;
using LoLStore.API.Models.ProductModel;
using LoLStore.API.Models.SupplierModel;
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

        config.NewConfig<Supplier, SupplierDto>()
			.Map(dest => dest.ProductCount,
				src => src.Products == null ? 0 : src.Products.Count);

        config.NewConfig<Product, ProductDto>();
		config.NewConfig<ProductEditModel, Product>()
			.Ignore(s => s.Categories);

        config.NewConfig<ProductHistory, ProductHistoryDto>()
			.Map(dest => dest.ProductName,
				src => src.Product.Name ?? "")
			.Map(dest => dest.UserName,
				src => src.User.Name);

        config.NewConfig<OrderDetail, OrderDetailDto>()
            .Map(dest => dest.Name,
                src => src.Product != null ? src.Product.Name : string.Empty)
            .Map(dest => dest.Sku,
                src => src.Product != null ? src.Product.Sku : string.Empty)
            .Map(dest => dest.ImageUrl,
                src => src.Product != null
                    && src.Product.Pictures != null
                    && src.Product.Pictures.Count > 0
                    ? src.Product.Pictures.First().Path
                    : string.Empty)
            .Map(dest => dest.UrlSlug,
                src => src.Product != null ? src.Product.UrlSlug : string.Empty);

    }
}