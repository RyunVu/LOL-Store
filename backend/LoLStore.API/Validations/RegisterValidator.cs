using FluentValidation;
using LoLStore.API.Models.UserModel;
using System.Text.RegularExpressions;

public class RegisterValidator : AbstractValidator<RegisterModel>
{
    public RegisterValidator()
    {
        RuleFor(s => s.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.");

        RuleFor(s => s.UserName)
            .NotEmpty().WithMessage("Username is required.")
            .MaximumLength(128).WithMessage("Username cannot exceed 128 characters.")
            .Must(BeAValidUsername).WithMessage("Username must not contain spaces.");

        RuleFor(s => s.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.");
    }

    private bool BeAValidUsername(string username)
    {
        // Username must contain no spaces
        string pattern = @"^\S+$";
        return Regex.IsMatch(username, pattern);
    }
}
