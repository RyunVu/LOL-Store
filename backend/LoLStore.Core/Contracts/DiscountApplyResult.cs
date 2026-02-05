namespace LoLStore.Core.Contracts;

public enum DiscountApplyResult
{
    Valid,
    NotFound,
    Inactive,
    Expired,
    MinimumNotMet,
    UsageExceeded
}
