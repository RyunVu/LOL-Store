using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoLStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class Update_Category_v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "MetaDescription",
                table: "Categories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetaDescription",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
