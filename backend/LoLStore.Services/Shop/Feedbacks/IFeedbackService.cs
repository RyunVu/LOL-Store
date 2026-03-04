using LoLStore.Core.DTO.Feedbacks;

namespace LoLStore.Services.Shop.Feedbacks;

public interface IFeedbackService
{
    Task<Guid> CreateFeedbackAsync(CreateFeedbackDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteFeedbackAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ToggleHideFeedbackAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ReportFeedbackAsync(CreateFeedbackReportDto dto, CancellationToken cancellationToken = default);
    Task<bool> ReviewReportAsync(ReviewFeedbackReportDto dto, CancellationToken cancellationToken = default);
}