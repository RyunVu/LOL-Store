public class PaginationResult<T> 
{
    public IEnumerable<T> Items { get; set; }
    public PagingMetadata Metadata { get; set; }
    public PaginationResult() {}
    public PaginationResult(IPagedList<T> pagedList)
    {
        Items = pagedList;
        Metadata = PagingMetadata.FromPagedList(pagedList);
    }
    
}