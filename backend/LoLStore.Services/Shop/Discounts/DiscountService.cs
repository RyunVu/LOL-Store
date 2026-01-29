using LoLStore.Core.Contracts;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Discounts;

public class DiscountService : IDiscountService
{
    private readonly IDiscountRepository _repo;

    public DiscountService(IDiscountRepository repo)
    {
        _repo = repo;
    }

    public async Task<(DiscountApplyResult, Discount?)> ValidateAsync(
        string code,
        decimal orderTotal)
    {
        var discount = await _repo.GetDiscountByCodeAsync(code);

        if (discount == null)
            return (DiscountApplyResult.NotFound, null);

        var now = DateTime.UtcNow;

        if (!discount.IsActive)
            return (DiscountApplyResult.Expired, null);

        if (discount.StartDate > now || discount.EndDate < now)
            return (DiscountApplyResult.Expired, null);

        if (discount.MinimunOrderAmount.HasValue &&
            orderTotal < discount.MinimunOrderAmount)
            return (DiscountApplyResult.MinimumNotMet, null);

        if (discount.MaxUses.HasValue &&
            discount.TimesUsed >= discount.MaxUses)
            return (DiscountApplyResult.UsageExceeded, null);

        return (DiscountApplyResult.Valid, discount);
    }
}
