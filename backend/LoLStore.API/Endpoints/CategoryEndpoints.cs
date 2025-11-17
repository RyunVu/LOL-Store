using System.Net;
using Azure;
using LoLStore.API.Models;
using LoLStore.API.Models.CategoryModel;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class CategoryEndpoints
{
    public static WebApplication MapCategoriesEndpoint(
        this WebApplication app)
    {
        var builder = app.MapGroup("/api/categories");

        #region GET Method

        builder.MapGet("/", GetCategories)
            .WithName("GetCategories")
            .Produces<ApiResponse<IPagedList<CategoryDto>>>();

        builder.MapGet("/byManager", GetCategoriesByManager)
            .WithName("GetCategoriesByManager")
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<CategoryDto>>>();

        builder.MapGet("/{id:guid}", GetCategoryById)
        .WithName("GetCategoryById")
        .Produces<ApiResponse<CategoryDto>>();

        #endregion


        return app;

    }

    private static async Task<IResult> GetCategories(
        [AsParameters] CategoryFilterModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        try
        {
            var query = mapper.Map<CategoryQuery>(model);

            var products =
                await repository.GetPagedCategoriesForUserAsync(
                    query,
                    model,
                    p => p.ProjectToType<CategoryDto>());

            var paginationResult = new PaginationResult<CategoryDto>(products);
            
            return Results.Ok(ApiResponse.Success(paginationResult));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> GetCategoriesByManager(
        [AsParameters] CategoryFilterModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        try
        {
            var query = mapper.Map<CategoryQuery>(model);

            var products =
                await repository.GetPagedCategoriesAsync(
                    query: query,
                    pagingParams: model,
                    mapper: p => p.ProjectToType<CategoryDto>());

            var paginationResult = new PaginationResult<CategoryDto>(products);

            return Results.Ok(ApiResponse.Success(paginationResult));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }
    
    private static async Task<IResult> GetCategoryById(
        [FromRoute] Guid id,
		[FromServices] ICategoryRepository repository,
		[FromServices] IMapper mapper)
    {
        try
        {
            var category = await repository.GetCategoryByIdAsync(id);
            var categoryItem = mapper.Map<CategoryDto>(category);

            return category == null
                ? Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category not exist"))
                : Results.Ok(ApiResponse.Success(categoryItem));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }
}