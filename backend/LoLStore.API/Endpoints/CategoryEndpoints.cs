using System.Net;
using Azure;
using LoLStore.API.Models;
using LoLStore.API.Models.CategoryModel;
using LoLStore.Core.Entities;
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
            .Produces<ApiResponse<IPagedList<CategoryDto>>>();

        builder.MapGet("/byManager", GetCategoriesByManager)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<CategoryDto>>>();

        builder.MapGet("/{id:guid}", GetCategoryById)
            .Produces<ApiResponse<CategoryDto>>();

        builder.MapGet("/slug/{slug:regex(^[a-z0-9_-]+$)}", GetCategoryBySlug)
            .Produces<ApiResponse<CategoryDto>>();

        builder.MapGet("/RelatedCategories", GetRelatedCategories)
            .Produces<ApiResponse<IList<CategoryDto>>>();

        builder.MapGet("/toggleShowOnMenu/{id:guid}", ToggleShowOnMenu)
            .RequireAuthorization("RequireManagerRole");

        #endregion

        # region POST Method
        
        builder.MapPost("/", AddCategory)
            .RequireAuthorization("RequireManagerRole");

        # endregion  

        # region PUT Method

        builder.MapPut("/{id:guid}", UpdateCategory)
            .RequireAuthorization("RequireManagerRole");

        # endregion

        # region DELETE Method

        builder.MapDelete("/SoftDeleteToggle/{id:guid}", SoftDeleteCategoryToggle)
            .RequireAuthorization("RequireManagerRole");

        builder.MapDelete("/{id:guid}", DeleteCategory)
            .RequireAuthorization("RequireManagerRole");

        #endregion

        return app;

    }

    private static async Task<IResult> GetCategories(
        [AsParameters] CategoryFilterModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
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

    private static async Task<IResult> GetCategoriesByManager(
        [AsParameters] CategoryFilterModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
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
    
    private static async Task<IResult> GetCategoryById(
        [FromRoute] Guid id,
		[FromServices] ICategoryRepository repository,
		[FromServices] IMapper mapper)
    {
        var category = await repository.GetCategoryByIdAsync(id);

        if (category == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.BadRequest,
                "Failed to update category."
            ));
        }
        var categoryItem = mapper.Map<CategoryDto>(category);

        return category == null
            ? Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category not exist"))
            : Results.Ok(ApiResponse.Success(categoryItem));
}

    private static async Task<IResult> GetCategoryBySlug(
        [FromRoute] string slug,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        var category = await repository.GetCategoryBySlugAsync(slug, true);

        if (category == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.BadRequest,
                "Failed to get category."
            ));
        }
        var categoryItem = mapper.Map<CategoryDto>(category);

        return category == null
            ? Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category is hidden or is not existed."))
            : Results.Ok(ApiResponse.Success(categoryItem));
    }

    private static async Task<IResult> GetRelatedCategories(
        [AsParameters] CategoryRelateModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        var condition = mapper.Map<CategoryQuery>(model);

        var categoryItems = await repository.GetRelatedCategoriesBySlugAsync(condition);

        var categoriesDto = mapper.Map<IList<CategoryDto>>(categoryItems); 

        return Results.Ok(ApiResponse.Success(categoriesDto));
    }
    
    private static async Task<IResult> ToggleShowOnMenu(
        [FromRoute] Guid id,
        [FromServices] ICategoryRepository repository)
    {
        if (await repository.ToggleShowOnMenuAsync(id).ConfigureAwait(false))
            return Results.Ok(ApiResponse.Success("Toggle state successfully.", HttpStatusCode.NoContent));
        
        return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category not exist"));
        
    }

    private static async Task<IResult> AddCategory(
        CategoryEditModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        if (await repository.IsCategoryNameExistedAsync(model.Name, Guid.Empty))
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.Conflict,
                $"Exist category with name: `{model.Name}`"));
        }

        var category = mapper.Map<Category>(model);

        await repository.AddOrUpdateCategoryAsync(category);

        return Results.Ok(ApiResponse.Success(mapper.Map<CategoryDto>(category), HttpStatusCode.Created));
    }

    private static async Task<IResult> UpdateCategory(
        [FromRoute] Guid id,
        CategoryEditModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        if (await repository.IsCategoryNameExistedAsync(model.Name, id))
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.Conflict,
                $"Category already exists with name: `{model.Name}`"));
        }

        var category = mapper.Map<Category>(model);
        category.Id = id;

        return await repository.AddOrUpdateCategoryAsync(category) != null
            ? Results.Ok(ApiResponse.Success("Category Updated!", HttpStatusCode.NoContent))
            : Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound));
    }

    private static async Task<IResult> SoftDeleteCategoryToggle(
        [FromRoute] Guid id,
        [FromServices] ICategoryRepository repository)
    {
        if (await repository.SoftDeleteToggleCategoryAsync(id).ConfigureAwait(false))
        {
            return Results.Ok(ApiResponse.Success("Category soft-delete state toggled successfully!", HttpStatusCode.NoContent));
        }
        return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category does not exist!"));
    }

    private static async Task<IResult> DeleteCategory(
        [FromRoute] Guid id,
        [FromServices] ICategoryRepository repository)
    {
        var category = await repository.GetCategoryByIdAsync(id);

        if (category == null)
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                $"Category not Existed!"
            ));
        else if (!category.IsDeleted)
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotAcceptable,
                $"Category is not marked as soft-deleted."
            ));

        await repository.HardDeleteCategoryAsync(id);

        return Results.Ok(ApiResponse.Success("Category deleted successfully.", HttpStatusCode.NoContent));
    }
}