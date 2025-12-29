using System.Net;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Media;
using LoLStore.API.Models;
using LoLStore.API.Models.ProductHistoryModel;
using LoLStore.API.Models.ProductModel;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class ProductEndpoint
{
    private const int MaxImageCount = 10;
    private const int MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB
    private static readonly string[] AllowedImageTypes =
        { "image/jpeg", "image/png", "image/webp" };

    public static WebApplication MapProductEndpoint(this WebApplication app)
    {
        var group = app.MapGroup("/api/products");

        #region GET
        group.MapGet("/", GetProducts);
        group.MapGet("/{id:guid}", GetProductById);
        group.MapGet("/bySlug/{slug:regex(^[a-z0-9_-]+$)}", GetProductBySlug);
        group.MapGet("/toggle-active/{id:guid}", ToggleActiveProduct)
            .RequireAuthorization("RequireManagerRole");
        group.MapGet("/histories", GetProductHistories)
            .RequireAuthorization("RequireAdminRole");
        group.MapGet("/TopSales/{num:int}", GetProductsTopSale);
        group.MapGet("/Related/{slug:regex(^[a-z0-9_-]+$)}/{num:int}", GetRelatedProducts);
        #endregion

        #region POST
        group.MapPost("/", AddProduct)
            .AddEndpointFilter<ValidatorFilter<ProductEditModel>>()
            .RequireAuthorization("RequireManagerRole");

        group.MapPost("/{id:guid}/pictures", SetProductPicture)
            .RequireAuthorization("RequireManagerRole")
            .Accepts<IList<IFormFile>>("multipart/form-data");
        #endregion

        #region PUT
        group.MapPut("/{id:guid}", UpdateProduct)
            .AddEndpointFilter<ValidatorFilter<ProductEditModel>>()
            .RequireAuthorization("RequireManagerRole");
        #endregion

        #region DELETE
        group.MapDelete("/toggleDelete/{id:guid}", ToggleDeleteProduct)
            .RequireAuthorization("RequireManagerRole");

        group.MapDelete("/{id:guid}", DeleteProduct)
            .RequireAuthorization("RequireAdminRole");

        group.MapDelete("/histories", DeleteHistory)
            .RequireAuthorization("RequireAdminRole");
        #endregion

        return app;
    }

    #region GET METHODS

    private static async Task<IResult> GetProducts(
        [AsParameters] ProductFilterModel model,
        IProductRepository repository,
        IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<ProductQuery>(model);
        model.PageSize ??= 20;

        var products = await repository.GetPagedProductsAsync(
            query,
            model,
            p => p.ProjectToType<ProductDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<ProductDto>(products)));
    }

    private static async Task<IResult> GetProductById(
        Guid id,
        IProductRepository repository,
        IMapper mapper,
        CancellationToken ct)
    {
        var product = await repository.GetProductByIdAsync(id, false, ct);
        return product == null
            ? Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"))
            : Results.Ok(ApiResponse.Success(mapper.Map<ProductDto>(product)));
    }

    private static async Task<IResult> GetProductBySlug(
        string slug,
        IProductRepository repository,
        IMapper mapper,
        CancellationToken ct)
    {
        var product = await repository.GetProductBySlugAsync(slug, ct);
        return product == null
            ? Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"))
            : Results.Ok(ApiResponse.Success(mapper.Map<ProductDto>(product)));
    }

    private static async Task<IResult> ToggleActiveProduct(
        Guid id,
        IProductRepository repository,
        CancellationToken ct)
    {
        return await repository.ToggleActiveProductAsync(id, ct)
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"));
    }

    private static async Task<IResult> GetProductHistories(
        [AsParameters] ProductHistoryFilterModel model,
        IProductRepository repository,
        IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<ProductHistoryQuery>(model);
        var histories = await repository.GetPagedProductHistoriesAsync(
            query,
            model,
            p => p.ProjectToType<ProductHistoryDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(
            new PaginationResult<ProductHistoryDto>(histories)));
    }

    private static async Task<IResult> GetProductsTopSale(
        int num,
        IProductRepository repository,
        IMapper mapper,
        CancellationToken ct)
    {
        var products = await repository.GetMostSaledProductsAsync(num, ct);
        return Results.Ok(ApiResponse.Success(mapper.Map<IList<ProductDto>>(products)));
    }

    private static async Task<IResult> GetRelatedProducts(
        string slug,
        int num,
        IProductRepository repository,
        IMapper mapper,
        CancellationToken ct)
    {
        var products = await repository.GetRelatedProductsAsync(slug, num, ct);
        return Results.Ok(ApiResponse.Success(mapper.Map<IList<ProductDto>>(products)));
    }

    #endregion

    #region POST / PUT METHODS

    private static async Task<IResult> AddProduct(
        HttpContext context,
        ProductEditModel model,
        IProductRepository productRepo,
        ISupplierRepository supplierRepo,
        IMapper mapper,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        if (await productRepo.IsProductNameExistedAsync(model.Name, null, ct))
            return Results.Conflict(ApiResponse.Fail(
                HttpStatusCode.Conflict,
                "Product name already exists"));

        if (await supplierRepo.GetSupplierByIdAsync(model.SupplierId, ct) == null)
            return Results.BadRequest(ApiResponse.Fail(
                HttpStatusCode.BadRequest, "Supplier not found"));

        var product = mapper.Map<Product>(model);

        await productRepo.AddOrUpdateProductAsync(
            product, user.Id, "Add new product", ct);

        await productRepo.SetProductCategoriesAsync(
            product, model.CategoryIds, ct);

        return Results.Created(
            $"/api/products/{product.Id}",
            ApiResponse.Success(mapper.Map<ProductDto>(product), HttpStatusCode.Created));
    }

    private static async Task<IResult> UpdateProduct(
        Guid id,
        HttpContext context,
        ProductEditModel model,
        IProductRepository repo,
        ISupplierRepository supplierRepo,
        IMapper mapper,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        if (string.IsNullOrWhiteSpace(model.EditReason))
            return Results.BadRequest(ApiResponse.Fail(
                HttpStatusCode.BadRequest, "Edit reason is required"));

        if (await repo.IsProductNameExistedAsync(model.Name, id, ct))
            return Results.Conflict(ApiResponse.Fail(
                HttpStatusCode.Conflict, "Product name already exists"));

        if (await supplierRepo.GetSupplierByIdAsync(model.SupplierId, ct) == null)
            return Results.NotFound(ApiResponse.Fail(
                HttpStatusCode.NotFound, "Supplier not found"));

        var product = await repo.GetProductByIdAsync(id, false, ct);
        if (product == null)
            return Results.NotFound(ApiResponse.Fail(
                HttpStatusCode.NotFound, "Product not found"));

        mapper.Map(model, product);

        await repo.AddOrUpdateProductAsync(
            product, user.Id, model.EditReason, ct);

        await repo.SetProductCategoriesAsync(
            product, model.CategoryIds, ct);

        return Results.Ok(ApiResponse.Success(mapper.Map<ProductDto>(product)));
    }

    private static async Task<IResult> SetProductPicture(
        Guid id,
        HttpContext context,
        IProductRepository repo,
        IMediaManager media,
        CancellationToken ct)
    {
        var files = context.Request.Form.Files;
        if (files.Count == 0 || files.Count > MaxImageCount)
            return Results.BadRequest(ApiResponse.Fail(
                HttpStatusCode.BadRequest, "Invalid image count"));

        foreach (var file in files)
            if (!IsValidImageFile(file))
                return Results.BadRequest(ApiResponse.Fail(
                    HttpStatusCode.BadRequest, $"Invalid file {file.FileName}"));

        if (await repo.GetProductByIdAsync(id, false, ct) == null)
            return Results.NotFound(ApiResponse.Fail(
                HttpStatusCode.NotFound, "Product not found"));

        var oldImages = await repo.GetImageUrlsAsync(id, ct);
        var newUrls = new List<string>();

        try
        {
            foreach (var file in files)
            {
                var url = await media.SaveFileAsync(
                    file.OpenReadStream(), file.FileName, file.ContentType);
                newUrls.Add(url);
            }

            await repo.DeleteImageUrlsAsync(id, ct);
            foreach (var url in newUrls)
                await repo.SetImageUrlAsync(id, url, ct);

            foreach (var img in oldImages)
                await media.DeleteFileAsync(img.Path);

            return Results.Ok(ApiResponse.Success("Pictures updated"));
        }
        catch
        {
            foreach (var url in newUrls)
                await media.DeleteFileAsync(url);
            throw;
        }
    }

    #endregion

    #region DELETE METHODS

    private static async Task<IResult> ToggleDeleteProduct(
        Guid id,
        HttpContext context,
        ProductEditModel model,
        IProductRepository repo,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        if (string.IsNullOrWhiteSpace(model.EditReason))
            return Results.BadRequest(ApiResponse.Fail(
                HttpStatusCode.BadRequest, "Delete reason is required"));

        return await repo.ToggleDeleteProductAsync(id, user.Id, model.EditReason, ct)
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(
                HttpStatusCode.NotFound, "Product not found"));
    }

    private static async Task<IResult> DeleteProduct(
        Guid id,
        IProductRepository repo,
        IMediaManager media)
    {
        var product = await repo.GetProductByIdAsync(id);
        if (product == null)
            return Results.NotFound(ApiResponse.Fail(
                HttpStatusCode.NotFound, "Product not found"));

        if (!product.IsDeleted)
            return Results.Conflict(ApiResponse.Fail(
                HttpStatusCode.Conflict, "Product must be soft-deleted first"));

        var images = await repo.GetImageUrlsAsync(id);
        foreach (var img in images)
            await media.DeleteFileAsync(img.Path);

        await repo.DeleteProductAsync(id);
        return Results.NoContent();
    }

    private static async Task<IResult> DeleteHistory(
        IList<Guid> ids,
        IProductRepository repo)
    {
        if (ids == null || ids.Count == 0)
            return Results.BadRequest(ApiResponse.Fail(
                HttpStatusCode.BadRequest, "History list cannot be empty"));

        return await repo.DeleteProductHistoriesAsync(ids)
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(
                HttpStatusCode.NotFound, "No histories were deleted"));
    }

    #endregion

    private static bool IsValidImageFile(IFormFile file) =>
        file.Length > 0 &&
        file.Length <= MaxImageSizeBytes &&
        AllowedImageTypes.Contains(file.ContentType.ToLower());
}
