using LoLStore.Core.DTO.Feedbacks;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Feedbacks;


public class FeedbackService : IFeedbackService
{
    private readonly IFeedbackRepository _repository;

    public FeedbackService(IFeedbackRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> CreateFeedbackAsync(
        CreateFeedbackDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            throw new InvalidOperationException("Rating must be between 1 and 5.");

        var feedback = new Feedback
        {
            ProductId = dto.ProductId,
            UserName = dto.UserName,
            Content = dto.Content,
            Rating = dto.Rating,
            Pictures = dto.PicturePaths.Select(url => new FeedbackPicture
            {
                Id = Guid.NewGuid(),
                Path = url
            }).ToList()
        };

        await _repository.AddFeedbackAsync(feedback, cancellationToken);
        return feedback.Id;
    }

    public async Task<bool> DeleteFeedbackAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var feedback = await _repository.GetFeedbackByIdAsync(id, cancellationToken);
        if (feedback == null) return false;

        return await _repository.DeleteFeedbackAsync(id, cancellationToken);
    }

    public async Task<bool> ToggleHideFeedbackAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var feedback = await _repository.GetFeedbackByIdAsync(id, cancellationToken);
        if (feedback == null) return false;

        return await _repository.ToggleHideFeedbackAsync(id, cancellationToken);
    }

    public async Task<bool> ReportFeedbackAsync(
        CreateFeedbackReportDto dto,
        CancellationToken cancellationToken = default)
    {
        var feedback = await _repository.GetFeedbackByIdAsync(dto.FeedbackId, cancellationToken);
        if (feedback == null)
            throw new InvalidOperationException("Feedback not found.");

        // Prevent duplicate reports from same user
        if (await _repository.HasUserReportedAsync(dto.FeedbackId, dto.ReporterName, cancellationToken))
            throw new InvalidOperationException("You have already reported this feedback.");

        var report = new FeedbackReport
        {
            FeedbackId = dto.FeedbackId,
            ReporterName = dto.ReporterName,
            Reason = dto.Reason,
            Status = FeedbackReportStatus.Pending
        };

        return await _repository.AddReportAsync(report, cancellationToken);
    }

    public async Task<bool> ReviewReportAsync(
        ReviewFeedbackReportDto dto,
        CancellationToken cancellationToken = default)
    {
        var report = await _repository.GetReportByIdAsync(dto.ReportId, cancellationToken);
        if (report == null) return false;

        // Update report status
        var result = await _repository.ReviewReportAsync(
            dto.ReportId, dto.Status, dto.AdminNote, cancellationToken);

        // Optionally hide the feedback
        if (result && dto.HideFeedback)
            await _repository.ToggleHideFeedbackAsync(report.FeedbackId, cancellationToken);

        return result;
    }
}