using System.Text.RegularExpressions;
using FluentValidation;
using LoLStore.WebAPI.Models.OrderModel;

namespace LoLStore.WebAPI.Validations;

public class OrderValidator : AbstractValidator<OrderEditModel>
{
	public OrderValidator()
	{
		RuleFor(post => post.Name)
			.NotEmpty().WithMessage("Order name is required.")
			.MaximumLength(512).WithMessage("Order name must not exceed 512 characters.");

		RuleFor(s => s.Note)
			.MaximumLength(2048).WithMessage("Order note must not exceed 2048 characters.");

        RuleFor(s => s.Phone)
            .NotEmpty().WithMessage("Supplier phone is required.")
            .Matches(@"^(0|\+84)(3|5|7|8|9)\d{8}$")
            .WithMessage("Phone number must be a valid Vietnam mobile number.");

		RuleFor(post => post.ShipAddress)
			.NotEmpty().WithMessage("Ship address is required.")
			.MaximumLength(1024).WithMessage("Ship address must not exceed 1024 characters.");
		
	}
}