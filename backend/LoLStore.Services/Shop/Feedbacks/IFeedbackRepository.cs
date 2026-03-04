using LoLStore.Core.DTO.Feedbacks;
using LoLStore.Core.Entities;
using LoLStore.Core.Queries;

namespace LoLStore.Services.Shop.Feedbacks;

public interface IFeedbackRepository
{
// Feedback
    Task<Feedback?> GetFeedbackByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedFeedbacksByProductAsync<T>(Guid productId, IPagingParams pagingParams, Func<IQueryable<Feedback>, IQueryable<T>> mapper, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedFeedbacksForAdminAsync<T>(FeedbackQuery query, IPagingParams pagingParams, Func<IQueryable<Feedback>, IQueryable<T>> mapper, CancellationToken cancellationToken = default);
    Task<bool> AddFeedbackAsync(Feedback feedback, CancellationToken cancellationToken = default);
    Task<bool> DeleteFeedbackAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ToggleHideFeedbackAsync(Guid id, CancellationToken cancellationToken = default);

    // Reports
    Task<FeedbackReport?> GetReportByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IPagedList<T>> GetPagedReportsAsync<T>(FeedbackReportQuery query, IPagingParams pagingParams, Func<IQueryable<FeedbackReport>, IQueryable<T>> mapper, CancellationToken cancellationToken = default);
    Task<bool> AddReportAsync(FeedbackReport report, CancellationToken cancellationToken = default);
    Task<bool> ReviewReportAsync(Guid reportId, FeedbackReportStatus status, string? adminNote, CancellationToken cancellationToken = default);
    Task<bool> HasUserReportedAsync(Guid feedbackId, string reporterName, CancellationToken cancellationToken = default);
}