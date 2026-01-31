using System.Net;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Media;
using LoLStore.API.Models;
using LoLStore.API.Models.ProductHistoryModel;
using LoLStore.API.Models.ProductModel;
using LoLStore.Core.Constants;
using LoLStore.Core.DTO.Products;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Helpers;
using LoLStore.Services.Shop;
using LoLStore.Services.Shop.Products;
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
        var builder = app.MapGroup("/api/products");

        #region GET

        builder.MapGet("/", GetProducts)
            .Produces<ApiResponse<IPagedList<ProductDto>>>();

        builder.MapGet("/byManager", GetProductsByManager)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<ProductAdminDto>>>();

        builder.MapGet("/{id:guid}", GetProductById)
            .Produces<ApiResponse<ProductDto>>();

        builder.MapGet("/bySlug/{slug:regex(^[a-z0-9_-]+$)}", GetProductBySlug)
            .Produces<ApiResponse<ProductDto>>();

        builder.MapGet("/histories", GetProductHistories)
            .RequireAuthorization("RequireAdminRole")
            .Produces<ApiResponse<IPagedList<ProductHistoryDto>>>();

        builder.MapGet("/TopSales/{num:int}", GetProductsTopSale)
            .Produces<ApiResponse<IList<ProductDto>>>();

        builder.MapGet("/Related/{slug:regex(^[a-z0-9_-]+$)}/{num:int}", GetRelatedProducts)
            .Produces<ApiResponse<IList<ProductDto>>>();

        #endregion

        #region POST

        builder.MapPost("/", AddProduct)
            .AddEndpointFilter<ValidatorFilter<ProductEditModel>>()
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<ProductDto>>();

        builder.MapPost("/{id:guid}/pictures", SetProductPicture)
            .RequireAuthorization("RequireManagerRole")
            .Accepts<IList<IFormFile>>("multipart/form-data");

        #endregion

        #region PUT

        builder.MapPut("/{id:guid}", UpdateProduct)
            .AddEndpointFilter<ValidatorFilter<ProductEditModel>>()
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<ProductDto>>();

        builder.MapPut("/toggle-active/{id:guid}", ToggleActiveProduct)
            .RequireAuthorization("RequireManagerRole");

        #endregion

        #region DELETE

        builder.MapDelete("/toggleDelete/{id:guid}", ToggleDeleteProduct)
            .RequireAuthorization("RequireManagerRole");

        builder.MapDelete("/{id:guid}", DeleteProduct)
            .RequireAuthorization("RequireAdminRole");

        builder.MapDelete("/histories", DeleteHistory)
            .RequireAuthorization("RequireAdminRole");

        #endregion

        return app;
    }

    #region GET METHODS

    private static async Task<IResult> GetProducts(
        [AsParameters] ProductFilterModel model,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<ProductQuery>(model);
        model.PageSize ??= 20;

        // Use the new public-facing method
        var products = await repository.GetPagedProductsForUserAsync(
            query,
            model,
            p => p.ProjectToType<ProductDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<ProductDto>(products)));
    }

    private static async Task<IResult> GetProductsByManager(
        [AsParameters] ProductManagerFilterModel model,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<ProductQuery>(model);

        model.SortColumn =
            SortColumnResolver.Resolve<Product>(model.DateFilter, nameof(Product.Name));
        model.PageSize ??= 20;
        if (query.DateFilter == DateFilterType.Deleted)
        {
            query.IsDeleted = true;
        }
        var products = await repository.GetPagedProductsAsync(
            query,
            model,
            p => p.ProjectToType<ProductAdminDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<ProductAdminDto>(products)));
    }

    private static async Task<IResult> GetProductById(
        [FromRoute] Guid id,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var product = await repository.GetProductByIdAsync(id, true, ct);
        return product == null
            ? Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"))
            : Results.Ok(ApiResponse.Success(mapper.Map<ProductDto>(product)));
    }

    private static async Task<IResult> GetProductBySlug(
        [FromRoute] string slug,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var product = await repository.GetProductBySlugAsync(slug, ct);
        return product == null
            ? Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"))
            : Results.Ok(ApiResponse.Success(mapper.Map<ProductDto>(product)));
    }

    private static async Task<IResult> ToggleActiveProduct(
        [FromRoute] Guid id,
        [FromServices] IProductService service,
        CancellationToken ct)
    {
        return await service.ToggleActiveAsync(id, ct)
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"));
    }

    private static async Task<IResult> GetProductHistories(
        [AsParameters] ProductHistoryFilterModel model,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
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
        [FromRoute] int num,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var products = await repository.GetMostSaledProductsAsync(num, ct);
        return Results.Ok(ApiResponse.Success(mapper.Map<IList<ProductDto>>(products)));
    }

    private static async Task<IResult> GetRelatedProducts(
        [FromRoute] string slug,
        [FromRoute] int num,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
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
        [FromServices] IProductService productService,
        [FromServices] IProductRepository productRepo,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        try
        {
            var createDto = mapper.Map<CreateProductDto>(model);
            var productId = await productService.CreateAsync(createDto, user.Id, ct);

            var product = await productRepo.GetProductByIdAsync(productId, true, ct);

            if (product == null)
            {
                return Results.NotFound(
                    ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found after creation"));
            }

            return Results.Created(
                $"/api/products/{productId}",
                ApiResponse.Success(mapper.Map<ProductDto>(product), HttpStatusCode.Created));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> UpdateProduct(
        [FromRoute] Guid id,
        HttpContext context,
        [FromBody] ProductEditModel model,
        [FromServices] IProductService productService,
        [FromServices] IProductRepository productRepo,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        try
        {
            var updateDto = mapper.Map<UpdateProductDto>((id, model));
            var success = await productService.UpdateAsync(updateDto, user.Id, ct);

            if (!success)
                return Results.NotFound(ApiResponse.Fail(
                    HttpStatusCode.NotFound, "Product not found"));

            var product = await productRepo.GetProductByIdAsync(id, true, ct);
            
            if (product == null)
            {
                return Results.NotFound(
                    ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found after creation"));
            }

            return Results.Ok(ApiResponse.Success(mapper.Map<ProductDto>(product)));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> SetProductPicture(
        [FromRoute] Guid id,
        HttpContext context,
        [FromServices] IProductRepository repo,
        [FromServices] IMediaManager media,
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

        var newUrls = new List<string>();

        try
        {
            foreach (var file in files)
            {
                var url = await media.SaveFileAsync(
                    file.OpenReadStream(), file.FileName, file.ContentType);
                newUrls.Add(url);
            }

            foreach (var url in newUrls)
                await repo.SetImageUrlAsync(id, url, ct);

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
        [FromRoute] Guid id,
        HttpContext context,
        [FromBody] ProductEditModel model,
        [FromServices] IProductService productService,
        CancellationToken ct)
    {
        var user = context.GetCurrentUser();
        if (user == null) return Results.Unauthorized();

        try
        {
            var reason = model.EditReason ?? string.Empty;
            var success = await productService.ToggleSoftDeleteAsync(id, user.Id, reason, ct);

            return success
                ? Results.NoContent()
                : Results.NotFound(ApiResponse.Fail(
                    HttpStatusCode.NotFound, "Product not found"));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> DeleteProduct(
        [FromRoute] Guid id,
        [FromServices] IProductService productService,
        [FromServices] IProductRepository repo,
        [FromServices] IMediaManager media,
        CancellationToken ct)
    {
        try
        {
            // Delete images first
            var images = await repo.GetImageUrlsAsync(id, ct);
            foreach (var img in images)
                await media.DeleteFileAsync(img.Path);

            // Delete product
            var success = await productService.DeletePermanentlyAsync(id, ct);

            return success
                ? Results.NoContent()
                : Results.NotFound(ApiResponse.Fail(
                    HttpStatusCode.NotFound, "Product not found"));
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ApiResponse.Fail(HttpStatusCode.Conflict, ex.Message));
        }
    }

    private static async Task<IResult> DeleteHistory(
        [FromBody] IList<Guid> ids,
        [FromServices] IProductRepository repo)
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