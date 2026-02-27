using FluentValidation;
using LoLStore.API.Models.UserModel;

namespace LoLStore.API.Validations;

public class PasswordEditValidator : AbstractValidator<PasswordEditModel>
{
    public PasswordEditValidator()
    {
        RuleFor(s => s.OldPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(s => s.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(8).WithMessage("New password must be at least 8 characters.");

        RuleFor(s => s.ConfirmPassword)
            .NotEmpty().WithMessage("Confirm password is required.");
    }
}