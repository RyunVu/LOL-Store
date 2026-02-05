using System.Net;
using LoLStore.API.Models;
using LoLStore.API.Models.DiscountModel;
using LoLStore.Core.Constants;
using LoLStore.Core.Contracts;
using LoLStore.Core.DTO.Discounts;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using LoLStore.Services.Shop.Discounts;
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
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<DiscountDto>>();

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
        [FromServices] IDiscountRepository repository,
        [FromServices] IMapper mapper)
    {
        var existingDiscount = await repository.GetByIdAsync(id);
        if (existingDiscount == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                "Discount not found."));
        }

        var dto = mapper.Map<UpdateDiscountDto>(model);
        dto.Id = id;

        await repository.SaveChangesAsync();

        return Results.Ok(ApiResponse.Success(
            mapper.Map<DiscountDto>(existingDiscount)));
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

}