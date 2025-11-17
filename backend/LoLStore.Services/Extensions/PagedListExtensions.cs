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
			: pagingParams.SortColumn;

		var order = "ASC".Equals(
			pagingParams.SortOrder, StringComparison.OrdinalIgnoreCase)
			? pagingParams.SortOrder
			: "DESC";
		return $"{column} {order}";
	}

    public static async Task<IPagedList<T>> ToPagedListAsync<T>(
        this IQueryable<T> source,
        IPagingParams pagingParams,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = pagingParams.PageNumber ?? 1;
        var pageSize = pagingParams.PageSize ?? 10;

        var totalItemCount = await source.CountAsync(cancellationToken);

        var items = await source
			.OrderBy(pagingParams.GetOrderExpression())
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedList<T>(items, pageNumber, pageSize, totalItemCount);
    }
    
    public static async Task<IPagedList<T>> ToPagedListAsync<T>(
        this IQueryable<T> source,
        int pageNumber = 1,
        int pageSize = 10,
        string sortColumn = "Id",
        string sortOrder = "DESC",
        CancellationToken cancellationToken = default)
    {
        var totalItemCount = await source.CountAsync(cancellationToken);

        var items = await source
            .OrderBy($"{sortColumn} {sortOrder}")
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedList<T>(items, pageNumber, pageSize, totalItemCount);
    }
}