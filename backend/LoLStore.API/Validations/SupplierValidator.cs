using FluentValidation;
using LoLStore.API.Models.SupplierModel;
using System.Text.RegularExpressions;

namespace LoLStore.API.Validations;

public class SupplierValidator : AbstractValidator<SupplierEditModel>
{
    public SupplierValidator()
    {
        RuleFor(s => s.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.");

        RuleFor(s => s.Name)
            .NotEmpty().WithMessage("Supplier company name is required.")
            .MaximumLength(256).WithMessage("Supplier company name cannot exceed 256 characters.");

        RuleFor(s => s.ContactName)
            .NotEmpty().WithMessage("Supplier contact name is required.")
            .MaximumLength(256).WithMessage("Supplier contact name cannot exceed 256 characters.");

        RuleFor(s => s.Phone)
            .NotEmpty().WithMessage("Supplier phone is required.")
            .Matches(@"^(0|\+84)(3|5|7|8|9)\d{8}$")
            .WithMessage("Phone number must be a valid Vietnam mobile number.");
    }
}
