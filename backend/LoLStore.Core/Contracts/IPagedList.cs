public interface IPagedList
{
    int PageCount { get; }
    int TotalItemCount { get; }
    int PageIndex { get; }
    int PageSize { get; }
    bool HasPreviousPage { get; }
    bool HasNextPage { get; }
    bool IsFirstPage { get; }
    bool IsLastPage { get; }
    int FirstItemIndex { get; }
    int LastItemIndex { get; }
}

public interface IPagedList<T> : IPagedList, IEnumerable<T>
{
    T this[int index] { get; }

    int Count { get; }  
}