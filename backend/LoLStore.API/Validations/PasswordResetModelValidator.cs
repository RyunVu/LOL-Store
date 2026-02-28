using FluentValidation;
using LoLStore.API.Models.UserModel;

namespace LoLStore.API.Validations;

public class PasswordResetModelValidator : AbstractValidator<PasswordResetModel>
{
    public PasswordResetModelValidator()
    {
        RuleFor(s => s.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(8).WithMessage("New password must be at least 8 characters.");
    }
}