using LoLStore.Core.Contracts;
using LoLStore.Core.DTO.Discounts;
using LoLStore.Core.Entities;
using LoLStore.Services.Extensions;

namespace LoLStore.Services.Shop.Discounts;

public class DiscountService : IDiscountService
{
    private readonly IDiscountRepository _repo;

    public DiscountService(IDiscountRepository repo)
    {
        _repo = repo;
    }


    public async Task<Guid> CreateAsync(CreateDiscountDto dto, CancellationToken ct = default)
    {
        var code = dto.Code.Trim().ToUpper();

        if(await _repo.IsDiscountExistedAsync(code, ct))
        {
            throw new InvalidOperationException($"Discount with code '{code}' already exists.");
        }

        var discount = new Discount
        {
            Code = code,
            IsActive = dto.IsActive,
            IsPercentage = dto.IsPercentage,
            DiscountValue = dto.DiscountValue,
            MinimunOrderAmount = dto.MinimunOrderAmount,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxUses = dto.MaxUses,
            TimesUsed = 0
        };

        await _repo.AddAsync(discount, ct);

        return discount.Id;
    }
    
    public async Task UpdateAsync(UpdateDiscountDto dto, CancellationToken ct = default)
    {
        var discount = await _repo.GetByIdAsync(dto.Id, ct)
            ?? throw new KeyNotFoundException($"Discount not found.");
        
        var code = dto.Code.Trim().ToUpper();
        if (!string.Equals(discount.Code, code, StringComparison.OrdinalIgnoreCase) &&
            await _repo.IsDiscountExistedAsync(code, ct))
        {
            throw new InvalidOperationException($"Discount with code '{code}' already exists.");
        }

        discount.Code = code;
        discount.IsActive = dto.IsActive;
        discount.IsPercentage = dto.IsPercentage;
        discount.DiscountValue = dto.DiscountValue;
        discount.MinimunOrderAmount = dto.MinimunOrderAmount;
        discount.StartDate = dto.StartDate;
        discount.EndDate = dto.EndDate;
        discount.MaxUses = dto.MaxUses;
        discount.UpdatedAt = DateTime.UtcNow;

        await _repo.SaveChangesAsync(ct);
    }

    public async Task ToggleSoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var discount = await _repo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Discount not found.");
        
        if (discount.IsDeleted)
        {
            // Restore
            discount.IsDeleted = false;
            discount.DeletedAt = null;
        }
        else
        {
            discount.IsDeleted = true;
            discount.IsActive = false;
            discount.DeletedAt = DateTime.UtcNow;
        }

        discount.UpdatedAt = DateTime.UtcNow;

        await _repo.SaveChangesAsync(ct);
    }


    public async Task DeletePermanentlyAsync(Guid id, CancellationToken ct = default)
    {
        var discount = await _repo.GetByIdAsync(id,  ct)
            ?? throw new KeyNotFoundException($"Discount not found.");
        
        // Validation for usage (Order) - not implemented yet

        var deleted = await _repo.DeletePermanentlyAsync(discount, ct);
        if (!deleted)
        {
            throw new InvalidOperationException("Failed to delete the discount permanently.");
        }
    }

    public async Task ToggleActiveAsync(Guid id, CancellationToken ct = default)
    {
        var discount = await _repo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Discount not found.");
        
        if(discount.IsDeleted)
            throw new InvalidOperationException("Cannot toggle active state of a deleted discount.");
        
        discount.IsActive = !discount.IsActive;
        discount.UpdatedAt = DateTime.UtcNow;

        await _repo.SaveChangesAsync(ct);
    }


    public async Task<(DiscountApplyResult, Discount?)> ValidateAsync(
        string code,
        decimal orderTotal)
    {
        var discount = await _repo.GetByCodeAsync(code);

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
