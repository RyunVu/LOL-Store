using System.Net;
using LoLStore.API.Models;
using LoLStore.API.Models.FeedbackModel;
using LoLStore.Core.DTO.Feedbacks;
using LoLStore.Core.Queries;
using LoLStore.Services.Shop.Feedbacks;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

public static class FeedbackEndpoint
{
    public static WebApplication MapFeedbackEndpoint(this WebApplication app)
    {
        var builder = app.MapGroup("/api/feedbacks");

        // Public
        builder.MapGet("/product/{productId:guid}", GetFeedbacksByProduct)
            .Produces<ApiResponse<IPagedList<FeedbackDto>>>();

        builder.MapPost("/", AddFeedback)
            .RequireAuthorization()
            .Produces<ApiResponse<FeedbackDto>>();

        builder.MapPost("/{id:guid}/report", ReportFeedback)
            .RequireAuthorization()
            .Produces<ApiResponse<string>>();

        // Admin
        builder.MapGet("/admin", GetFeedbacksForAdmin)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<FeedbackAdminDto>>>();

        builder.MapGet("/reports", GetReports)
            .RequireAuthorization("RequireManagerRole")
            .Produces<ApiResponse<IPagedList<FeedbackReportDto>>>();

        builder.MapPut("/{id:guid}/toggle-hide", ToggleHideFeedback)
            .RequireAuthorization("RequireManagerRole");

        builder.MapPut("/reports/{reportId:guid}/review", ReviewReport)
            .RequireAuthorization("RequireManagerRole");

        builder.MapDelete("/{id:guid}", DeleteFeedback)
            .RequireAuthorization("RequireAdminRole");

        return app;
    }

    private static async Task<IResult> GetFeedbacksByProduct(
        [FromRoute] Guid productId,
        [AsParameters] FeedbackFilterModel model,
        [FromServices] IFeedbackRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var feedbacks = await repository.GetPagedFeedbacksByProductAsync(
            productId,
            model,
            f => f.ProjectToType<FeedbackDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<FeedbackDto>(feedbacks)));
    }

    private static async Task<IResult> GetFeedbacksForAdmin(
        [AsParameters] FeedbackFilterModel model,
        [FromServices] IFeedbackRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<FeedbackQuery>(model);
        var feedbacks = await repository.GetPagedFeedbacksForAdminAsync(
            query,
            model,
            f => f.ProjectToType<FeedbackAdminDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<FeedbackAdminDto>(feedbacks)));
    }

    private static async Task<IResult> GetReports(
        [AsParameters] FeedbackReportFilterModel model,
        [FromServices] IFeedbackRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        var query = mapper.Map<FeedbackReportQuery>(model);
        var reports = await repository.GetPagedReportsAsync(
            query,
            model,
            r => r.ProjectToType<FeedbackReportDto>(),
            ct);

        return Results.Ok(ApiResponse.Success(new PaginationResult<FeedbackReportDto>(reports)));
    }

    private static async Task<IResult> AddFeedback(
        [FromBody] FeedbackEditModel model,
        [FromServices] IFeedbackService service,
        [FromServices] IFeedbackRepository repository,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        try
        {
            var dto = mapper.Map<CreateFeedbackDto>(model);
            var id = await service.CreateFeedbackAsync(dto, ct);
            var feedback = await repository.GetFeedbackByIdAsync(id, ct);

            if (feedback is null)
            {
                return Results.NotFound(
                    ApiResponse.Fail(HttpStatusCode.NotFound, "Feedback not found after creation"));
            }
            
            return Results.Created(
                $"/api/feedbacks/{id}",
                ApiResponse.Success(mapper.Map<FeedbackDto>(feedback), HttpStatusCode.Created));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> ReportFeedback(
        [FromRoute] Guid id,
        [FromBody] FeedbackReportEditModel model,
        [FromServices] IFeedbackService service,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        try
        {
            var dto = mapper.Map<CreateFeedbackReportDto>((id, model));
            await service.ReportFeedbackAsync(dto, ct);
            return Results.Ok(ApiResponse.Success("Report submitted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> ToggleHideFeedback(
        [FromRoute] Guid id,
        [FromServices] IFeedbackService service,
        CancellationToken ct)
    {
        return await service.ToggleHideFeedbackAsync(id, ct)
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Feedback not found"));
    }

    private static async Task<IResult> ReviewReport(
        [FromRoute] Guid reportId,
        [FromBody] ReviewReportEditModel model,
        [FromServices] IFeedbackService service,
        [FromServices] IMapper mapper,
        CancellationToken ct)
    {
        try
        {
            var dto = mapper.Map<ReviewFeedbackReportDto>((reportId, model));
            return await service.ReviewReportAsync(dto, ct)
                ? Results.NoContent()
                : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Report not found"));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ApiResponse.Fail(HttpStatusCode.BadRequest, ex.Message));
        }
    }

    private static async Task<IResult> DeleteFeedback(
        [FromRoute] Guid id,
        [FromServices] IFeedbackService service,
        CancellationToken ct)
    {
        return await service.DeleteFeedbackAsync(id, ct)
            ? Results.NoContent()
            : Results.NotFound(ApiResponse.Fail(HttpStatusCode.NotFound, "Feedback not found"));
    }
}