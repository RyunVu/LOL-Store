using LoLStore.Core.Contracts;
using LoLStore.Core.DTO.Discounts;
using LoLStore.Core.Entities;

namespace LoLStore.Services.Shop.Discounts;

public interface IDiscountService
{
    Task<(DiscountApplyResult Result, Discount? Discount)> ValidateAsync(
        string code,
        decimal orderTotal);
    Task<Guid> CreateAsync(CreateDiscountDto dto, CancellationToken ct = default);
    Task UpdateAsync(UpdateDiscountDto dto, CancellationToken ct = default);
    Task ToggleSoftDeleteAsync(Guid id, CancellationToken ct = default);
    Task ToggleActiveAsync(Guid id, CancellationToken ct = default);
    Task DeletePermanentlyAsync(Guid id, CancellationToken ct = default);
}
