namespace LoLStore.API.Models;

public class ValidationFailureResponse
{
    public IReadOnlyCollection<string> Errors { get; }
    public ValidationFailureResponse(IEnumerable<string> errors)
    {
        Errors = errors?.ToArray() ?? Array.Empty<string>();
    }
}