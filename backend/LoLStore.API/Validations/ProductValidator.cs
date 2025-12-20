using FluentValidation;
using LoLStore.API.Models.ProductModel;

namespace LoLStore.API.Validations;

public class ProductValidator : AbstractValidator<ProductEditModel>
{
    public ProductValidator()
    {
        RuleFor(x => x.EditReason)
            .MaximumLength(2048)
            .WithMessage("Edit reason must not exceed 2048 characters.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Product name is required.")
            .MaximumLength(255)
            .WithMessage("Product name must not exceed 255 characters.");

        RuleFor(x => x.Instruction)
            .MaximumLength(2048)
            .WithMessage("Instruction must not exceed 2048 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2048)
            .WithMessage("Description must not exceed 2048 characters.");

        RuleFor(x => x.Note)
            .MaximumLength(2048)
            .WithMessage("Note must not exceed 2048 characters.");
    }
}
