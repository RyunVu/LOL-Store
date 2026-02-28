using System.Net;
using LoLStore.API.Models;
using LoLStore.API.Models.DiscountModel;
using LoLStore.Core.Constants;
using LoLStore.Core.Contracts;
using LoLStore.Core.DTO.Discounts;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Helpers;
using LoLStore.Services.Shop.Discounts;
using LoLStore.Services.Shop.Orders;
using LoLStore.WebAPI.Models.DiscountModel;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class DiscountEndpoints
{
    public static WebApplication MapDiscountEndpoint(this WebApplication app)
    {
        var builder = app.MapGroup("/api/discounts");

        #region GET Methods

        builder.MapGet("/", GetDiscounts)
            .Produces<ApiResponse<IPagedList<DiscountDto>>>();

        builder.MapGet("/byManager", GetDiscountsByManager)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<DiscountAdminDto>>>();

        builder.MapGet("/{id:guid}", GetDiscountById)
            .Produces<ApiResponse<DiscountDto>>();

        builder.MapGet("/byCode/{code}", GetDiscountByCode)
            .Produces<ApiResponse<DiscountDto>>();

        #endregion

        #region POST Methods

        builder.MapPost("/", AddDiscount)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<DiscountDto>>();

        builder.MapPost("/validateDiscount", CheckValidDiscount)
            .Produces<ApiResponse<DiscountDto>>();

        #endregion

        #region PUT Methods

        builder.MapPut("/{id:guid}", UpdateDiscount)
            .RequireAuthorization("RequireManagerRole");

        builder.MapPut("/toggleShowOnMenu/{id:guid}", ToggleActiveStatus)
            .RequireAuthorization("RequireManagerRole");

        #endregion

        #region DELETE Methods

        builder.MapDelete("/toggleDelete/{id:guid}", ToggleDeleteDiscount)
            .RequireAuthorization("RequireManagerRole");

        builder.MapDelete("/{id:guid}", DeleteDiscount)
            .RequireAuthorization("RequireAdminRole");

        #endregion

        return app;
    }

    private static async Task<IResult> GetDiscounts(
        [AsParameters] DiscountFilterModel model,
        [FromServices] IDiscountRepository repository,
        [FromServices] IMapper mapper)
    {
        var condition = mapper.Map<DiscountQuery>(model);

        var discounts = await repository.GetPagedDiscountAsync(
            condition,
            model,
            p => p.ProjectToType<DiscountDto>());

        var paginationResult = new PaginationResult<DiscountDto>(discounts);

        return Results.Ok(ApiResponse.Success(paginationResult));
    }

        private static async Task<IResult> GetDiscountsByManager(
        [AsParameters] DiscountManagerFilterModel model,
        [FromServices] IDiscountRepository repository,
        [FromServices] IMapper mapper)
    {
        var condition = mapper.Map<DiscountQuery>(model);

        model.SortColumn = 
            SortColumnResolver.DateFilterResolve<Discount>(model.DateFilter, nameof(Discount.Code));

        model.SortColumn = StatusFilterResolve<Discount>(model.Status, model.SortColumn);

        if (condition.DateFilter == DateFilterType.Deleted)
        {
            condition.IsDeleted = true;
        }

        var discounts = await repository.GetPagedDiscountAsync(
            condition,
            model,
            p => p.ProjectToType<DiscountAdminDto>());

        var paginationResult = new PaginationResult<DiscountAdminDto>(discounts);

        return Results.Ok(ApiResponse.Success(paginationResult));
    }


    private static async Task<IResult> GetDiscountById(
        [FromRoute] Guid id,
        [FromServices] IDiscountRepository repository,
        [FromServices] IMapper mapper)
    {
        var discount = await repository.GetByIdAsync(id);

        if (discount == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                "Discount code not found."));
        }

        return Results.Ok(ApiResponse.Success(mapper.Map<DiscountDto>(discount)));
    }

    private static async Task<IResult> GetDiscountByCode(
        [FromRoute] string code,
        [FromServices] IDiscountRepository repository,
        [FromServices] IMapper mapper)
    {
        var discount = await repository.GetByCodeAsync(code);

        if (discount == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                $"Discount code '{code}' does not exist."));
        }

        return Results.Ok(ApiResponse.Success(mapper.Map<DiscountDto>(discount)));
    }

    private static async Task<IResult> AddDiscount(
        [FromBody] DiscountEditModel model,
        [FromServices] IDiscountRepository repository,
        [FromServices] IDiscountService service,
        [FromServices] IMapper mapper)
    {
        var dto = mapper.Map<CreateDiscountDto>(model);
        var result = await service.CreateAsync(dto);

        return Results.Created(
            $"/api/discounts/{result}",
            ApiResponse.Success(
                result,
                HttpStatusCode.Created)
        );
    }

    private static async Task<IResult> UpdateDiscount(
        [FromRoute] Guid id,
        [FromBody] DiscountEditModel model,
        [FromServices] IDiscountService service,
        [FromServices] IDiscountRepository repository,
        [FromServices] IMapper mapper)
    {        
        var dto = mapper.Map<UpdateDiscountDto>((id, model));

        await service.UpdateAsync(dto);

        return Results.Ok(ApiResponse.Success(
            ApiResponse.Success("Discount updated successfully.", HttpStatusCode.NoContent)
        ));
    }


    private static async Task<IResult> CheckValidDiscount(
        [FromBody] DiscountOrdersModel model,
        [FromServices] IDiscountService discountService,
        [FromServices] IOrderRepository orderRepo,
        [FromServices] IMapper mapper)
    {
        var tempOrder = await orderRepo.GetProductOrderAsync(model.Detail);

        var (result, discount) = await discountService.ValidateAsync(
            model.DiscountCode,
            tempOrder.TotalAmount);

        return result switch
        {
            DiscountApplyResult.Valid when discount is not null =>
                Results.Ok(ApiResponse.Success(
                    mapper.Map<DiscountDto>(discount))),

            DiscountApplyResult.MinimumNotMet =>
                Results.Ok(ApiResponse.Fail(
                    HttpStatusCode.NotAcceptable,
                    "Order total does not meet minimum requirement.")),

            DiscountApplyResult.UsageExceeded =>
                Results.Ok(ApiResponse.Fail(
                    HttpStatusCode.NotAcceptable,
                    "Discount usage limit exceeded.")),

            DiscountApplyResult.Expired =>
                Results.Ok(ApiResponse.Fail(
                    HttpStatusCode.NotAcceptable,
                    "Discount has expired or is inactive.")),

            _ =>
                Results.Ok(ApiResponse.Fail(
                    HttpStatusCode.NotFound,
                    "Discount code not found."))
        };

    }

    private static string StatusFilterResolve<TEntity>(
        DiscountStatus? statusFilter,
        string defaultColumn)
        where TEntity : BaseEntity
    {
        return statusFilter switch
        {
            DiscountStatus.Active => nameof(Discount.Status),
            DiscountStatus.Inactive => nameof(Discount.Status),
            DiscountStatus.Expired => nameof(Discount.Status),
            DiscountStatus.Scheduled => nameof(Discount.Status),
            _ => defaultColumn
        };
    }

    private static async Task<IResult> ToggleActiveStatus(
        [FromRoute] Guid id,
        [FromServices] IDiscountService service,
        CancellationToken ct)
    {
        await service.ToggleActiveAsync(id, ct);
        return Results.Ok(
            ApiResponse.Success("Discount visibility toggled.", HttpStatusCode.NoContent)
        );
    }

    private static async Task<IResult> ToggleDeleteDiscount(
        [FromRoute] Guid id,
        [FromServices] IDiscountService service,
        CancellationToken ct)
    {
        await service.ToggleSoftDeleteAsync(id, ct);
        return Results.Ok(
                ApiResponse.Success("Discount soft-deleted successfully.", HttpStatusCode.NoContent)
            );
    }

    private static async Task<IResult> DeleteDiscount(
        [FromRoute] Guid id,
        [FromServices] IDiscountService service,
        CancellationToken ct)
    {
        await service.DeletePermanentlyAsync(id, ct);

        return Results.Ok(
            ApiResponse.Success("Discount deleted permanently.", HttpStatusCode.NoContent)
        );
    }
}