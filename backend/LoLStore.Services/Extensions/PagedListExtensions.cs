using System.Linq.Dynamic.Core;
using Microsoft.EntityFrameworkCore;

namespace LoLStore.Services.Extensions;

public static class PagedListExtensions
{
 
    public static string GetOrderExpression(
        this IPagingParams pagingParams,
        string defaultColumn = "Id")
    {
        var column = string.IsNullOrWhiteSpace(pagingParams.SortColumn)
            ? defaultColumn
            : pagingParams.SortColumn.Trim();

        var order = string.Equals(
            pagingParams.SortOrder,
            "ASC",
            StringComparison.OrdinalIgnoreCase)
            ? "ASC"
            : "DESC";

        return $"{column} {order}";
    }

    public static async Task<IPagedList<T>> ToPagedListAsync<T>(
        this IQueryable<T> source,
        IPagingParams pagingParams,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = pagingParams.PageNumber.GetValueOrDefault(1);
        var pageSize = pagingParams.PageSize.GetValueOrDefault(10);

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var pageIndex = pageNumber - 1; 

        var totalItemCount = await source.CountAsync(cancellationToken);

        var items = await source
            .OrderBy(pagingParams.GetOrderExpression())
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedList<T>(items, pageIndex, pageSize, totalItemCount);
    }

    public static async Task<IPagedList<T>> ToPagedListAsync<T>(
        this IQueryable<T> source,
        int pageNumber = 1,
        int pageSize = 10,
        string sortColumn = "Id",
        string sortOrder = "DESC",
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var pageIndex = pageNumber - 1;

        var order = string.Equals(sortOrder, "ASC", StringComparison.OrdinalIgnoreCase)
            ? "ASC"
            : "DESC";

        var totalItemCount = await source.CountAsync(cancellationToken);

        var items = await source
            .OrderBy($"{sortColumn} {order}")
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedList<T>(items, pageIndex, pageSize, totalItemCount);
    }
}
