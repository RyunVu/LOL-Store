using System.Net;
using LoLStore.API.Filter;
using LoLStore.API.Identities;
using LoLStore.API.Models;
using LoLStore.API.Models.ProductModel;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace  LoLStore.API.Endpoints;

public static class ProductEndpoint
{
    public static WebApplication MapProductEndpoint(this WebApplication app)
    {
        var routeGroupBuilder = app.MapGroup("/api/products");

        #region GET Method
        routeGroupBuilder.MapGet("/", GetProducts)
            .WithName("GetProducts")
            .Produces<ApiResponse<IPagedList<ProductDto>>>();

        routeGroupBuilder.MapGet("/{id:guid}", GetProductById)
            .WithName("GetProductById")
            .Produces<ApiResponse<ProductDto>>();

        routeGroupBuilder.MapGet("/bySlug/{slug:regex(^[a-z0-9_-]+$)}", GetProductBySlug)
            .WithName("GetProductBySlug")
            .Produces<ApiResponse<ProductDto>>();

        routeGroupBuilder.MapGet("/toggleActive/{id:guid}", ToggleActiveProduct)
            .WithName("ToggleActiveProduct")
            .RequireAuthorization("RequireManagerRole")
			.Produces(204)
			.Produces(404);

        #endregion

        #region POST Method

        routeGroupBuilder.MapPost("/", AddProduct)
            .WithName("AddProduct")
            .AddEndpointFilter<ValidatorFilter<ProductEditModel>>()
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<ProductDto>>()
            .Produces(201)
            .Produces(400)
            .Produces(409);

        #endregion

        #region PUT Method

        #endregion

        #region DELETE Method

        #endregion

        return app;
    }     

    private static async Task<IResult> GetProducts(
        [AsParameters] ProductFilterModel model,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken)
    {
        try
        {
            var query  = mapper.Map<ProductQuery>(model);
            model.PageSize ??= 20;

            var products = await repository.GetPagedProductsAsync(
                query,
                model,
                p => p.ProjectToType<ProductDto>(),
                cancellationToken);

            var paginationResult = new PaginationResult<ProductDto>(products);

            return Results.Ok(ApiResponse.Success(paginationResult));

        }
        catch (Exception e)
        {
			return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> GetProductById(
        Guid id,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken)
    {
        try
        {
            var product = await repository.GetProductByIdAsync(id, false, cancellationToken);
            if (product == null)
            {
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"));
            }

            var productDto = mapper.Map<ProductDto>(product);
            return Results.Ok(ApiResponse.Success(productDto));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> GetProductBySlug(
        string slug,
        [FromServices] IProductRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken)
    {
        try
        {
            var product = await repository.GetProductBySlugAsync(slug, cancellationToken);
            if (product == null)
            {
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"));
            }

            var productDetail = mapper.Map<ProductDto>(product);
            return Results.Ok(ApiResponse.Success(productDetail));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }    
    }

    private static async Task<IResult> ToggleActiveProduct(
        Guid id,
        [FromServices] IProductRepository repository,
        CancellationToken cancellationToken)
    {
        try
        {
            return await repository.ToggleActiveProductAsync(id, cancellationToken)
                ? Results.Ok(ApiResponse.Success("Product active status toggled successfully", HttpStatusCode.NoContent))
                : Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Product not found"));

        }catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));  
        }
    }

    private static async Task<IResult> AddProduct(
        HttpContext context,
        ProductEditModel model,
        [FromServices] IProductRepository productRepository,
        [FromServices] ICategoryRepository categoryRepository,
        [FromServices] ISupplierRepository supplierRepository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = context.GetCurrentUser();
            if (user == null)
            {
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.Unauthorized, "User not authenticated."));
            }

            if (await productRepository.IsProductExistedAsync(model.Name, null, cancellationToken))
            {
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.Conflict, $"Product name `{model.Name}` already exists"));
            }

            var isExissSupplier = await supplierRepository.GetSupplierByIdAsync(model.SupplierId, cancellationToken);
            if (isExissSupplier == null)
            {
                return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, "Supplier not found"));
            }

            var product = mapper.Map<Product>(model);

            await productRepository.AddOrUpdateProductAsync(product, user.Id, "Add new product", cancellationToken);

            await productRepository.SetProductCategoriesAsync(product.Id, model.CategoryIds, cancellationToken);

            return Results.Ok(ApiResponse.Success(
                mapper.Map<ProductDto>(product),
                HttpStatusCode.Created));

        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }  
    }
    

    

}