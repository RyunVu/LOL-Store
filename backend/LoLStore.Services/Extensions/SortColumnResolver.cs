using LoLStore.Core.Constants;
using LoLStore.Core.Contracts;

namespace LoLStore.Services.Helpers;

public static class SortColumnResolver
{
    public static string Resolve<TEntity>(
        DateFilterType? dateFilter,
        string defaultColumn)
        where TEntity : BaseEntity
    {
        return dateFilter switch
        {
            DateFilterType.Created => nameof(BaseEntity.CreatedAt),
            DateFilterType.Updated => nameof(BaseEntity.UpdatedAt),
            DateFilterType.Deleted => nameof(BaseEntity.DeletedAt),
            _ => defaultColumn
        };
    }

}
