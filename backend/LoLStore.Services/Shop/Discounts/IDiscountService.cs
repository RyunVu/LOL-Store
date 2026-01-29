using LoLStore.Core.Contracts;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Discounts;

public interface IDiscountService
{
    Task<(DiscountApplyResult Result, Discount? Discount)> ValidateAsync(
        string code,
        decimal orderTotal);
}
