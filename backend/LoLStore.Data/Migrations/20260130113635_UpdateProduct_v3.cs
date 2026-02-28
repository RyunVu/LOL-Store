using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoLStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProduct_v3 : Migration
    {
        /// <inheritdoc />
            protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('dbo.Products', 'Active') IS NOT NULL
                AND COL_LENGTH('dbo.Products', 'IsActive') IS NULL
                BEGIN
                    EXEC sp_rename 'dbo.Products.Active', 'IsActive', 'COLUMN';
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
