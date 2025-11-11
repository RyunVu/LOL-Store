using Microsoft.EntityFrameworkCore;

public class PagedList<T> : IPagedList<T>
{
    private readonly List<T> _items;

    public PagedList(IEnumerable<T> items, int pageIndex, int pageSize, int totalItemCount)
    {
        if (pageSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize), "Page size must be greater than zero.");
        }

        if (pageIndex < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageIndex), "Page index cannot be negative.");
        }

        _items = new List<T>(items);
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalItemCount = totalItemCount;
        PageCount = (int)Math.Ceiling(totalItemCount / (double)pageSize);
    }

    public int PageCount { get; }
    public int TotalItemCount { get; }
    public int PageIndex { get; }
    public int PageSize { get; }
    public int PageNumber => PageIndex + 1;

    public bool HasPreviousPage => PageIndex > 0;
    public bool HasNextPage => PageIndex + 1 < PageCount;
    public bool IsFirstPage => PageIndex == 0;
    public bool IsLastPage => PageIndex + 1 >= PageCount;

    public int FirstItemIndex => PageIndex * PageSize + 1;
    public int LastItemIndex => Math.Min((PageIndex + 1) * PageSize, TotalItemCount);

    public IReadOnlyList<T> Items => _items.AsReadOnly();
    public int Count => _items.Count;
    public T this[int index] => _items[index];

    public IEnumerator<T> GetEnumerator() => _items.GetEnumerator();
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();

    public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var totalItemCount = await source.CountAsync(cancellationToken).ConfigureAwait(false);
        var items = await source
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        return new PagedList<T>(items, pageIndex, pageSize, totalItemCount);
    }

    public static PagedList<T> Empty => new PagedList<T>(new List<T>(), 0, 1, 0);
}