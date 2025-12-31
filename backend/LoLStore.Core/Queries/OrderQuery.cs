using LoLStore.Core.Entities;

namespace LoLStore.Core.Queries;

public class OrderQuery
{
    public int? Year { get; set;}   
    public int? Month { get; set;}   
    public int? Day { get; set;}   
    public OrderStatus? Status { get; set;}   
    public string? Keyword { get; set; }
}