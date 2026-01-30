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
            migrationBuilder.RenameColumn(
                name: "Active",
                table: "Products",
                newName: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "Products",
                newName: "Active");
        }
    }
}
