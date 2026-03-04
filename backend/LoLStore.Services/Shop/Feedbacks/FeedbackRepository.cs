using LoLStore.Core.Entities;
using LoLStore.Core.Queries;
using LoLStore.Data.Contexts;
using LoLStore.Services.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Shop.Feedbacks;

public class FeedbackRepository : IFeedbackRepository
{
    private readonly StoreDbContext _context;

    public FeedbackRepository(StoreDbContext context)
    {
        _context = context;
    }

    // =======================
    // Feedback
    // =======================

    public async Task<Feedback?> GetFeedbackByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Feedback>()
            .Include(f => f.Pictures)
            .Include(f => f.Reports)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public Task<IPagedList<T>> GetPagedFeedbacksByProductAsync<T>(
        Guid productId,
        IPagingParams pagingParams,
        Func<IQueryable<Feedback>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var feedbacks = _context.Set<Feedback>()
            .AsNoTracking()
            .Include(f => f.Pictures) 
            .Where(f => f.ProductId == productId && !f.IsHidden)
            .OrderByDescending(f => f.CreatedAt);

        return mapper(feedbacks).ToPagedListAsync(pagingParams, cancellationToken);
    }

    public Task<IPagedList<T>> GetPagedFeedbacksForAdminAsync<T>(
        FeedbackQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<Feedback>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var feedbacks = FilterFeedbacks(query);
        return mapper(feedbacks).ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<bool> AddFeedbackAsync(
        Feedback feedback,
        CancellationToken cancellationToken = default)
    {
        _context.Set<Feedback>().Add(feedback);
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> DeleteFeedbackAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<Feedback>()
            .Where(f => f.Id == id)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<bool> ToggleHideFeedbackAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var feedback = await _context.Set<Feedback>()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (feedback == null) return false;

        feedback.IsHidden = !feedback.IsHidden;
        feedback.UpdatedAt = DateTime.UtcNow;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    // =======================
    // Reports
    // =======================

    public async Task<FeedbackReport?> GetReportByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<FeedbackReport>()
            .Include(r => r.Feedback)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public Task<IPagedList<T>> GetPagedReportsAsync<T>(
        FeedbackReportQuery query,
        IPagingParams pagingParams,
        Func<IQueryable<FeedbackReport>, IQueryable<T>> mapper,
        CancellationToken cancellationToken = default)
    {
        var reports = FilterReports(query);
        return mapper(reports).ToPagedListAsync(pagingParams, cancellationToken);
    }

    public async Task<bool> AddReportAsync(
        FeedbackReport report,
        CancellationToken cancellationToken = default)
    {
        _context.Set<FeedbackReport>().Add(report);
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> ReviewReportAsync(
        Guid reportId,
        FeedbackReportStatus status,
        string? adminNote,
        CancellationToken cancellationToken = default)
    {
        var report = await _context.Set<FeedbackReport>()
            .FirstOrDefaultAsync(r => r.Id == reportId, cancellationToken);

        if (report == null) return false;

        report.Status = status;
        report.AdminNote = adminNote;
        report.ReviewedAt = DateTime.UtcNow;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> HasUserReportedAsync(
        Guid feedbackId,
        string reporterName,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<FeedbackReport>()
            .AnyAsync(r =>
                r.FeedbackId == feedbackId &&
                r.ReporterName == reporterName,
                cancellationToken);
    }

    // =======================
    // Private Helpers
    // =======================

    private IQueryable<Feedback> FilterFeedbacks(FeedbackQuery query)
    {
        var feedbacks = _context.Set<Feedback>()
            .AsNoTracking()
            .Include(f => f.Pictures)
            .Include(f => f.Reports)
            .AsQueryable();

        feedbacks = feedbacks
            .WhereIf(query.ProductId.HasValue,
                f => f.ProductId == query.ProductId!.Value)

            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword),
                f => f.Content.Contains(query.Keyword!) ||
                     f.UserName.Contains(query.Keyword!))

            .WhereIf(query.MinRating.HasValue,
                f => f.Rating >= query.MinRating!.Value)

            .WhereIf(query.MaxRating.HasValue,
                f => f.Rating <= query.MaxRating!.Value)

            .WhereIf(query.IsHidden.HasValue,
                f => f.IsHidden == query.IsHidden!.Value);

        if (query.HasReports)
            feedbacks = feedbacks.Where(f => f.Reports.Any());

        return feedbacks.OrderByDescending(f => f.CreatedAt);
    }

    private IQueryable<FeedbackReport> FilterReports(FeedbackReportQuery query)
    {
        var reports = _context.Set<FeedbackReport>()
            .AsNoTracking()
            .Include(r => r.Feedback)
            .AsQueryable();

        reports = reports
            .WhereIf(query.FeedbackId.HasValue,
                r => r.FeedbackId == query.FeedbackId!.Value)

            .WhereIf(query.Status.HasValue,
                r => r.Status == query.Status!.Value)

            .WhereIf(!string.IsNullOrWhiteSpace(query.Keyword),
                r => r.Reason.Contains(query.Keyword!) ||
                     r.ReporterName.Contains(query.Keyword!) ||
                     r.Feedback.Content.Contains(query.Keyword!));

        return reports.OrderByDescending(r => r.CreatedAt);
    }
}