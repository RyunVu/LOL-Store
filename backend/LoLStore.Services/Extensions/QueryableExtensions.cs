using System.Linq.Expressions;

namespace LoLStore.Services.Extensions;

public static class QueryableExtensions
{
    public static IQueryable<T> WhereIf<T>(
        this IQueryable<T> query,
        bool condition,
        Expression<Func<T, bool>> predicate)
    {
        return condition
            ? query.Where(predicate)
            : query;
    }
    
    public static IQueryable<T> WhereIf<T>(
        this IQueryable<T> query,
        bool condition,
        Expression<Func<T, int, bool>> predicate)
    {
        return condition
            ? query.Where(predicate)
            : query;
    }
}