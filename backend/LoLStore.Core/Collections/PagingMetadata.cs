public class PagingMetadata
{ 
    public int TotalItemCount { get; private set; }
    public int PageIndex { get; private set; }
    public int PageSize { get; private set; }
    public int PageCount => PageSize == 0 ? 0 : (int)Math.Ceiling((double)TotalItemCount / PageSize);

    public bool HasPreviousPage => PageIndex > 0;
    public bool HasNextPage => (PageIndex < PageCount - 1);
    public bool IsFirstPage => PageIndex <= 0;
    public bool IsLastPage => PageIndex >= (PageCount - 1);

    public int FirstItemIndex => (PageIndex * PageSize) + 1;
    public int LastItemIndex => Math.Min(TotalItemCount, (PageIndex * PageSize) + PageSize);

    public PagingMetadata(int pageIndex, int pageSize, int totalCount)
    {
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalItemCount = totalCount;
    }
    
    public static PagingMetadata FromPagedList<T>(IPagedList<T> pagedList)
    {
        if (pagedList == null)
            throw new ArgumentNullException(nameof(pagedList));

        return new PagingMetadata(pagedList.PageIndex, pagedList.PageSize, pagedList.TotalItemCount);
    }
}