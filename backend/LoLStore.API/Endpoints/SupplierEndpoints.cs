using System.Net;
using LoLStore.API.Filter;
using LoLStore.API.Models;
using LoLStore.API.Models.SupplierModel;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace LoLStore.API.Endpoints;

public static class SupplierEndpoints
{
    public static WebApplication MapSupplierEndpoint(this WebApplication app)
    {
        var builder = app.MapGroup("/api/suppliers");

        #region GET Methods
        
        builder.MapGet("/", GetPagedSuppliersAsync)
            .WithName("GetPagedSuppliersAsync")
			.RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<SupplierDto>>>();

        #endregion

        #region POST Methods

        builder.MapPost("/", AddSupplierAsync)
			.WithName("AddSupplierAsync")
			.RequireAuthorization("RequireManagerRole")
			.AddEndpointFilter<ValidatorFilter<SupplierEditModel>>()
			.Produces<ApiResponse<SupplierDto>>();

        #endregion

        #region PUT Methods

        builder.MapPut("/{supplierId:guid}", UpdateSupplierAsync)
			.WithName("UpdateSupplierAsync")
			.RequireAuthorization("RequireManagerRole")
			.AddEndpointFilter<ValidatorFilter<SupplierEditModel>>()
			.Produces<ApiResponse>();

        #endregion

        #region DELETE Methods

        builder.MapDelete("/toggleDelete/{supplierId:guid}", ToggleDeleteSupplierAsync)
            .WithName("ToggleDeleteSupplierAsync")
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse>();

        #endregion

        return app;
    }

    private static async Task<IResult> GetPagedSuppliersAsync(
        HttpContext context,
        [AsParameters] SupplierFilterModel model,
        [FromServices] ISupplierRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken = default)
    {
        var condition = mapper.Map<SupplierQuery>(model);

        var supplier = await repository.GetPagedSuppliersAsync(
            condition,
            model,
            q => q.ProjectToType<SupplierDto>(),
            cancellationToken);

        var paginationResult = new PaginationResult<SupplierDto>(supplier);

        return Results.Ok(ApiResponse.Success(paginationResult));
    }

    private static async Task<IResult> AddSupplierAsync(
        HttpContext context,
        SupplierEditModel model,
        [FromServices] ISupplierRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken = default)
    {
        var supplier = mapper.Map<Supplier>(model);

        await repository.AddOrUpdateSupplierAsync(supplier, cancellationToken);

        return Results.Ok(ApiResponse.Success(
            mapper.Map<SupplierDto>(supplier),
            HttpStatusCode.Created));
    }

    private static async Task<IResult> UpdateSupplierAsync(
        [FromRoute] Guid supplierId,
        SupplierEditModel model,
        [FromServices] ISupplierRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken cancellationToken = default)
    {
        var supplier = await repository.GetSupplierByIdAsync(supplierId, cancellationToken);
        if (supplier == null)
        {
            return Results.Ok(ApiResponse.Fail(
                HttpStatusCode.NotFound,
                $"Cannot find supplier with id: {supplierId}"));
        }

        mapper.Map(model, supplier);

        await repository.AddOrUpdateSupplierAsync(supplier, cancellationToken);

        return Results.Ok(ApiResponse.Success(
            mapper.Map<SupplierDto>(supplier),
            HttpStatusCode.OK));       
    }

    private static async Task<IResult> ToggleDeleteSupplierAsync(
        [FromRoute] Guid supplierId,
        [FromServices] ISupplierRepository repository,
        CancellationToken cancellationToken = default)
    {
    var supplier = await repository.GetSupplierByIdAsync(supplierId, cancellationToken);

    if (supplier == null)
    {
        return Results.Ok(ApiResponse.Fail(
            HttpStatusCode.NotFound,
            $"Cannot find supplier with id: {supplierId}"));
    }

    await repository.ToggleDeleteSupplierAsync(supplierId, cancellationToken);

    return Results.Ok(ApiResponse.Success("Supplier deletion status toggled successfully."));

    }
}