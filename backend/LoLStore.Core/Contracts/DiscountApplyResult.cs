namespace LoLStore.Core.Contracts;

public enum DiscountApplyResult
{
    Valid,
    NotFound,
    Expired,
    MinimumNotMet,
    UsageExceeded
}
