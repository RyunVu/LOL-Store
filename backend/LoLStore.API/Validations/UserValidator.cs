using FluentValidation;
using LoLStore.API.Models.UserModel;

namespace LoLStore.API.Validations;

public class UserValidator : AbstractValidator<UserEditModel>
{
    public UserValidator()
    {
        RuleFor(u => u.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(256).WithMessage("Name cannot exceed 256 characters.");

        RuleFor(u => u.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.");

        RuleFor(u => u.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^(0|\+84)(3|5|7|8|9)\d{8}$")
            .WithMessage("Phone number must be a valid Vietnam mobile number.")
            .When(u => !string.IsNullOrEmpty(u.Phone));

        RuleFor(u => u.Address)
            .MaximumLength(512).WithMessage("Address cannot exceed 512 characters.");
    }
}