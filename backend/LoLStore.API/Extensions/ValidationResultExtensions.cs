using FluentValidation.Results;
using LoLStore.API.Models;

namespace Store.WebAPI.Extensions;

public static class ValidationResultExtensions
{
    /// <summary>
    /// Converts a ValidationResult into a standard ValidationFailureResponse.
    /// </summary>
    public static ValidationFailureResponse ToResponse(this ValidationResult validationResult)
        => validationResult.Errors.ToResponse();

    /// <summary>
    /// Converts a collection of ValidationFailure to a ValidationFailureResponse.
    /// </summary>
    public static ValidationFailureResponse ToResponse(this IEnumerable<ValidationFailure> failures)
        => new(failures.Select(f => f.ErrorMessage));

    /// <summary>
    /// Extracts all error messages from a ValidationResult as a list of strings.
    /// </summary>
    public static IList<string> GetErrorMessages(this ValidationResult validationResult)
        => validationResult.Errors.GetErrorMessages();

    /// <summary>
    /// Extracts all error messages from a collection of ValidationFailure as a list of strings.
    /// </summary>
    public static IList<string> GetErrorMessages(this IEnumerable<ValidationFailure> failures)
        => failures?.Select(f => f.ErrorMessage).ToList() ?? new List<string>();

    /// <summary>
    /// Returns a dictionary where the key is the property name and the value is a list of error messages.
    /// </summary>
    public static IDictionary<string, List<string>> GetErrorsWithPropertyNames(this ValidationResult validationResult)
        => validationResult.Errors.GetErrorsWithPropertyNames();

    /// <summary>
    /// Returns a dictionary of property names and their associated validation messages.
    /// </summary>
    public static IDictionary<string, List<string>> GetErrorsWithPropertyNames(this IEnumerable<ValidationFailure> failures)
    {
        if (failures == null)
            return new Dictionary<string, List<string>>();

        return failures
            .GroupBy(f => f.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(f => f.ErrorMessage).ToList());
    }
}
