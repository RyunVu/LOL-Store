using System.Net;
using LoLStore.API.Models;
using LoLStore.API.Models.CategoryModel;
using LoLStore.Core.Constants;
using LoLStore.Core.DTO.Categories;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Helpers;
using LoLStore.Services.Shop.Categories;
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
            .Produces<ApiResponse<IPagedList<CategoryAdminDto>>>();

        builder.MapGet("/{id:guid}", GetCategoryById)
            .Produces<ApiResponse<CategoryDto>>();

        builder.MapGet("/slug/{slug:regex(^[a-z0-9_-]+$)}", GetCategoryBySlug)
            .Produces<ApiResponse<CategoryDto>>();

        builder.MapGet("/RelatedCategories", GetRelatedCategories)
            .Produces<ApiResponse<IList<CategoryDto>>>();

        #endregion

        # region POST Method
        
        builder.MapPost("/", AddCategory)
            .RequireAuthorization("RequireManagerRole");

        # endregion  

        # region PUT Method

        builder.MapPut("/{id:guid}", UpdateCategory)
            .RequireAuthorization("RequireManagerRole");

        builder.MapPut("/toggleShowOnMenu/{id:guid}", ToggleShowOnMenu)
            .RequireAuthorization("RequireManagerRole");

        # endregion

        # region DELETE Method

        builder.MapDelete("/SoftDeleteToggle/{id:guid}", SoftDeleteCategoryToggle)
            .RequireAuthorization("RequireManagerRole");

        builder.MapDelete("/{id:guid}", DeleteCategoryPermanently)
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
        [AsParameters] CategoryManagerFilterModel model,
        [FromServices] ICategoryRepository repository,
        [FromServices] IMapper mapper)
    {
        var query = mapper.Map<CategoryQuery>(model);

        model.SortColumn =
            SortColumnResolver.DateFilterResolve<Category>(model.DateFilter, nameof(Category.Name));

        if (query.DateFilter == DateFilterType.Deleted)
        {
            query.IsDeleted = true;
        }
        
        var categories =
            await repository.GetPagedCategoriesAsync(
                query: query,
                pagingParams: model,
                mapper: p => p.ProjectToType<CategoryAdminDto>());

        var paginationResult = new PaginationResult<CategoryAdminDto>(categories);

        return Results.Ok(ApiResponse.Success(paginationResult));
    }
    
    private static async Task<IResult> GetCategoryById(
        [FromRoute] Guid id,
		[FromServices] ICategoryRepository repository,
		[FromServices] IMapper mapper)
    {
        var category = await repository.GetByIdAsync(id);

        if (category == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                "Category not found."
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
        var category = await repository.GetActiveBySlugAsync(slug);

        if (category == null)
        {
            return Results.Ok(
                ApiResponse.Fail(HttpStatusCode.NotFound, "Category not found.")
            );
        }

        return Results.Ok(
            ApiResponse.Success(mapper.Map<CategoryDto>(category))
        );
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
        [FromServices] ICategoryService service)
    {
        await service.ToggleActiveAsync(id);

        return Results.Ok(
            ApiResponse.Success("Category visibility toggled.", HttpStatusCode.NoContent)
        );
    }

    private static async Task<IResult> AddCategory(
        CategoryEditModel model,
        ICategoryService service,
        IMapper mapper)
    {
        var dto = mapper.Map<CreateCategoryDto>(model);
        var result = await service.CreateAsync(dto);

        return Results.Created(
            $"/categories/{result}",
            ApiResponse.Success(result)
        );
    }

    private static async Task<IResult> UpdateCategory(
        [FromRoute] Guid id,
        [FromBody] CategoryEditModel model,
        [FromServices] ICategoryService service,
        [FromServices] IMapper mapper)
    {

        var dto = mapper.Map<UpdateCategoryDto>((id, model));

        await service.UpdateAsync(dto);

        return Results.Ok(
            ApiResponse.Success("Category updated successfully.", HttpStatusCode.NoContent)
        );
    }

    private static async Task<IResult> SoftDeleteCategoryToggle(
        [FromRoute] Guid id,
        [FromServices] ICategoryService service)
    {
        await service.ToggleSoftDeleteAsync(id);

        return Results.Ok(
            ApiResponse.Success("Category soft-deleted successfully.", HttpStatusCode.NoContent)
        );
    }

    private static async Task<IResult> DeleteCategoryPermanently(
        [FromRoute] Guid id,
        [FromServices] ICategoryService service)
    {
        await service.DeletePermanentlyAsync(id);

        return Results.Ok(
            ApiResponse.Success("Category deleted permanently.", HttpStatusCode.NoContent)
        );
    }

}