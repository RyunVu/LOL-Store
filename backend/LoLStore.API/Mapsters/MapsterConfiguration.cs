using LoLStore.API.Models.CategoryModel;
using LoLStore.API.Models.DiscountModel;
using LoLStore.API.Models.OrderModel;
using LoLStore.API.Models.PictureModel;
using LoLStore.API.Models.ProductHistoryModel;
using LoLStore.API.Models.ProductModel;
using LoLStore.API.Models.SupplierModel;
using LoLStore.API.Models.UserModel;
using LoLStore.Core.Constants;
using LoLStore.Core.DTO;
using LoLStore.Core.DTO.Categories;
using LoLStore.Core.DTO.Discounts;
using LoLStore.Core.DTO.Products;
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
        
        config.NewConfig<PictureInputModel, PictureInputDto>();

        // Product -> ProductDto
        config.NewConfig<Product, ProductDto>()
                .Map(dest => dest.FinalPrice,
                    src => src.Price - (src.Price * src.Discount / 100));

        // Product -> ProductAdminDto
        config.NewConfig<Product, ProductAdminDto>()
                .Inherits<Product, ProductDto>();

        // ProductEditModel -> CreateProductDto
        config.NewConfig<ProductEditModel, CreateProductDto>();

        // (Guid, ProductEditModel) -> UpdateProductDto
        config.NewConfig<(Guid Id, ProductEditModel Model), UpdateProductDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest, src => src.Model);

        // ProductFilterModel -> ProductQuery
        config.NewConfig<ProductFilterModel, ProductQuery>();

        // ProductManagerFilterModel -> ProductQuery
        config.NewConfig<ProductManagerFilterModel, ProductQuery>();

        config.NewConfig<ProductEditModel, Product>()
            .Ignore(dest => dest.Categories)
            .Ignore(dest => dest.Pictures);

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

        config.NewConfig<Discount, DiscountAdminDto>()
            .Map(dest => dest.OrderCount, 
                src => src.Orders == null ? 0 : src.Orders.Count)
            .Map(dest => dest.Status, src =>
                !src.IsActive
                    ? DiscountStatus.Inactive
                    : DateTime.UtcNow < src.StartDate
                        ? DiscountStatus.Scheduled
                        : DateTime.UtcNow > src.EndDate
                            ? DiscountStatus.Expired
                            : DiscountStatus.Active
            );

        config.NewConfig<Discount, DiscountDto>()
            .Map(dest => dest.OrderCount, 
                src => src.Orders == null ? 0 : src.Orders.Count)
            .Map(dest => dest.Status, src =>
                !src.IsActive
                    ? DiscountStatus.Inactive
                    : DateTime.UtcNow < src.StartDate
                        ? DiscountStatus.Scheduled
                        : DateTime.UtcNow > src.EndDate
                            ? DiscountStatus.Expired
                            : DiscountStatus.Active
            );

        config.NewConfig<DiscountEditModel, CreateDiscountDto>();

        config.NewConfig<(Guid id, DiscountEditModel model), UpdateDiscountDto>()
            .Map(dest => dest.Id, src => src.id)
            .Map(dest => dest.Code, src => src.model.Code)
            .Map(dest => dest.DiscountValue, src => src.model.DiscountValue)
            .Map(dest => dest.IsPercentage, src => src.model.IsPercentage)
            .Map(dest => dest.MinimunOrderAmount, src => src.model.MinimunOrderAmount)
            .Map(dest => dest.MaxUses, src => src.model.MaxUses)
            .Map(dest => dest.StartDate, src => src.model.StartDate)
            .Map(dest => dest.EndDate, src => src.model.EndDate)
            .Map(dest => dest.IsActive, src => src.model.IsActive);

        config.NewConfig<DiscountFilterModel, DiscountQuery>()
            .Map(dest => dest.Code, src => src.Code)
            .Map(dest => dest.DiscountValue, src => src.DiscountValue)
            .Map(dest => dest.IsPercentage, src => src.IsPercentage)
            .Map(dest => dest.MinimunOrderAmount, src => src.MinimunOrderAmount)
            .Map(dest => dest.IsActive, src => src.IsActive)
            .Map(dest => dest.StartDate, src => src.StartDate)
            .Map(dest => dest.EndDate, src => src.EndDate);

        config.NewConfig<DiscountManagerFilterModel, DiscountQuery>()
            .Map(dest => dest.Code, src => src.Code)
            .Map(dest => dest.IsActive, src => src.IsActive)
            .Map(dest => dest.IsDeleted, src => src.IsDeleted)
            .Map(dest => dest.ValidNow, src => src.ValidNow)
            .Map(dest => dest.Status, src => src.Status)
            .Map(dest => dest.DateFilter, src => src.DateFilter);

        config.NewConfig<DiscountEditModel, Discount>()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.CreatedAt)
            .Ignore(dest => dest.IsDeleted)
            .Ignore(dest => dest.TimesUsed) 
            .Ignore(dest => dest.UpdatedAt!)
            .Ignore(dest => dest.DeletedAt!);       

    }
}