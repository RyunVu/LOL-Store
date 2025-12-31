namespace LoLStore.API.Models.DashboardModel
{
    public class DashboardDto
    {
        public int TotalOrder { get; set; }

        public int OrderToday { get; set; }

        public int TotalCategories { get; set; }

        public int TotalProduct { get; set; }

        public decimal RevenueToday { get; set; }

        public decimal TotalRevenue { get; set; }
    }
}