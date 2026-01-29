using LoLStore.API.Models.CategoryModel;
using LoLStore.API.Models.DiscountModel;
using LoLStore.API.Models.OrderModel;
using LoLStore.API.Models.ProductHistoryModel;
using LoLStore.API.Models.ProductModel;
using LoLStore.API.Models.SupplierModel;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.Constants;
using LoLStore.Core.DTO.Categories;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.WebAPI.Models.DiscountModel;
using Mapster;

namespace LoLStore.API.Mapsters;

public class MapsterConfiguration : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Category, CategoryAdminDto>()
            .Map(dest => dest.ProductCount,
                src => src.Products == null ? 0 : src.Products.Count);

        config.NewConfig<Category, CategoryDto>()
            .Map(dest => dest.ProductCount,
                src => src.Products == null ? 0 : src.Products.Count);

        config.NewConfig<CategoryEditModel, CreateCategoryDto>();

        config.NewConfig<(Guid id, CategoryEditModel model), UpdateCategoryDto>()
            .Map(dest => dest.Id, src => src.id)
            .Map(dest => dest.Name, src => src.model.Name)
            .Map(dest => dest.Description, src => src.model.Description)
            .Map(dest => dest.IsActive, src => src.model.IsActive);

         config.NewConfig<CategoryFilterModel, CategoryQuery>()
            .Map(dest => dest.Keyword, src => src.Keyword)
            .Map(dest => dest.IsActive, src => src.IsActive);


        config.NewConfig<CategoryManagerFilterModel, CategoryQuery>()
            .Map(dest => dest.Keyword, src => src.Keyword)
            .Map(dest => dest.IsActive, src => src.IsActive)
            .Map(dest => dest.IsDeleted, src => src.IsDeleted)
            .Map(dest => dest.DateFilter, src => src.DateFilter);


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

        config.NewConfig<Product, ProductDto>()
            .Map(dest => dest.Discount, src => src.Discount)
            .Map(dest => dest.FinalPrice,
                src => src.Discount > 0
                    ? src.Price - (src.Price * src.Discount / 100m)
                    : src.Price);
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

        config.NewConfig<Discount, DiscountDto>()
            .Map(dest => dest.Status, src =>
                !src.IsActive
                    ? DiscountStatus.Inactive
                    : DateTime.UtcNow < src.StartDate
                        ? DiscountStatus.Scheduled
                        : DateTime.UtcNow > src.EndDate
                            ? DiscountStatus.Expired
                            : DiscountStatus.Active
            );

        config.NewConfig<DiscountEditModel, Discount>()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.CreatedAt)
            .Ignore(dest => dest.IsDeleted)
            .Ignore(dest => dest.TimesUsed) 
            .Ignore(dest => dest.UpdatedAt!)
            .Ignore(dest => dest.DeletedAt!);

        config.NewConfig<DiscountFilterModel, DiscountQuery>()
            .Map(dest => dest.Code, src => src.Code)
            .Map(dest => dest.DiscountValue, src => src.DiscountValue)
            .Map(dest => dest.IsPercentage, src => src.IsPercentage)
            .Map(dest => dest.MinimunOrderAmount, src => src.MinimunOrderAmount)
            .Map(dest => dest.IsActive, src => src.IsActive)
            .Map(dest => dest.StartDate, src => src.StartDate)
            .Map(dest => dest.EndDate, src => src.EndDate)
            .Map(dest => dest.Year, src => src.Year)
            .Map(dest => dest.Month, src => src.Month)
            .Map(dest => dest.Day, src => src.Day);
    }
}