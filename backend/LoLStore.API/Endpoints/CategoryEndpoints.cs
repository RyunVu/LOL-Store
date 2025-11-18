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
            .WithName("GetCategories")
            .Produces<ApiResponse<IPagedList<CategoryDto>>>();

        builder.MapGet("/byManager", GetCategoriesByManager)
            .WithName("GetCategoriesByManager")
            // .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<CategoryDto>>>();

        builder.MapGet("/{id:guid}", GetCategoryById)
            .WithName("GetCategoryById")
            .Produces<ApiResponse<CategoryDto>>();

        builder.MapGet("/slug/{slug:regex(^[a-z0-9_-]+$)}", GetCategoryBySlug)
            .WithName("GetCategoryBySlug")
            .Produces<ApiResponse<CategoryDto>>();

        builder.MapGet("/RelatedCategories", GetRelatedCategories)
            .WithName("GetRelatedCategories")
            .Produces<ApiResponse<IList<CategoryDto>>>();

        builder.MapGet("/toggleShowOnMenu/{id:guid}", ToggleShowOnMenu)
            .WithName("ToggleCategoryShowOnMenu")
            // .RequireAuthorization("RequireManagerRole")
            .Produces(204)
            .Produces(404);

        #endregion

        # region POST Method
        
        builder.MapPost("/", AddCategory)
            .WithName("AddCategory")
            // .RequireAuthorization("RequireManagerRole")
            .Produces(201)      // Created
            .Produces(400)      // Bad Request
            .Produces(409);     // Conflict

        # endregion  

        # region PUT Method

        builder.MapPut("/{id:guid}", UpdateCategory)
            .WithName("UpdateCategory")
            // .RequireAuthorization("RequireManagerRole")
            .Produces(204)     // Not content
			.Produces(400)
			.Produces(409);

        # endregion

        # region DELETE Method

        builder.MapDelete("/SoftDeleteToggle/{id:guid}", SoftDeleteCategoryToggle)
            .WithName("SoftDeleteCategoryToggle")
            // .RequireAuthorization("RequireManagerRole")
			.Produces(204)
			.Produces(404);

        builder.MapDelete("/{id:guid}", DeleteCategory)
            .WithName("DeleteCategory")
            // .RequireAuthorization("RequireManagerRole")
			.Produces<ApiResponse>(204)
			.Produces<ApiResponse>(404);

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

    private static async Task<IResult> GetCategoryBySlug(
        [FromRoute] string slug,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        try
        {
            var category = await repository.GetCategoryBySlugAsync(slug, true);
            var categoryItem = mapper.Map<CategoryDto>(category);

            return category == null
                ? Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category is hidden or is not existed."))
                : Results.Ok(ApiResponse.Success(categoryItem));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }    
    }

    private static async Task<IResult> GetRelatedCategories(
        [AsParameters] CategoryRelateModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        try
        {
            var condition = mapper.Map<CategoryQuery>(model);

            var categoryItems = await repository.GetRelatedCategoriesBySlugAsync(condition);

            var categoriesDto = mapper.Map<IList<CategoryDto>>(categoryItems); 

            return Results.Ok(ApiResponse.Success(categoriesDto));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }
    
    private static async Task<IResult> ToggleShowOnMenu(
        [FromRoute] Guid id,
        [FromServices] ICategoryRepository repository)
    {
        try
        {
            if (await repository.ToggleShowOnMenuAsync(id).ConfigureAwait(false))
                return Results.Ok(ApiResponse.Success("Toggle state successfully.", HttpStatusCode.NoContent));
            
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category not exist"));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> AddCategory(
        CategoryEditModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        try
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
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> UpdateCategory(
        [FromRoute] Guid id,
        CategoryEditModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        try
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
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> SoftDeleteCategoryToggle(
        [FromRoute] Guid id,
        [FromServices] ICategoryRepository repository)
    {
        try
        {
            if (await repository.SoftDeleteToggleCategoryAsync(id).ConfigureAwait(false))
            {
                return Results.Ok(ApiResponse.Success("Category soft-delete state toggled successfully!", HttpStatusCode.NoContent));
            }
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.NotFound, "Category does not exist!"));
        }
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }

    private static async Task<IResult> DeleteCategory(
        [FromRoute] Guid id,
        [FromServices] ICategoryRepository repository)
    {
        try
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
        catch (Exception e)
        {
            return Results.Ok(ApiResponse.Fail(HttpStatusCode.BadRequest, e.Message));
        }
    }
}