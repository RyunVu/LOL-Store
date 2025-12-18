using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace LoLStore.API.Filter;

public class ValidatorFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T> _validator;

    public ValidatorFilter(IValidator<T> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var model = context.Arguments.OfType<T>().FirstOrDefault();

        if (model is null)
        {
            return Results.BadRequest("Invalid request model.");
        }

        var validationResult = await _validator.ValidateAsync(model);

        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new
            {
                e.PropertyName,
                e.ErrorMessage
            });

            return Results.BadRequest(errors);
        }

        return await next(context);
    }
}
