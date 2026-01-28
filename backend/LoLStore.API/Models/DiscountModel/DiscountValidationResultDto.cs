using LoLStore.Core.Constants;
using LoLStore.Core.Contracts;

namespace LoLStore.API.Models.DiscountModel;

public class DiscountValidationResultDto
{
    public DiscountApplyResult Result { get; set; }
    public DiscountStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
}
