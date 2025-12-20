public class PaginationResult<T>
{
    public IEnumerable<T> Items { get; }
    public PagingMetadata Metadata { get; }
    public PaginationResult(IPagedList<T> pagedList)
    {
        Items = pagedList;
        Metadata = PagingMetadata.FromPagedList(pagedList);
    }
}
