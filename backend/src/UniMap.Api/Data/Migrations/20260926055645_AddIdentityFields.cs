using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "age_range",
                table: "profiles",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nationality",
                table: "profiles",
                type: "character(2)",
                fixedLength: true,
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "pronouns",
                table: "profiles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "age_range",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "nationality",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "pronouns",
                table: "profiles");
        }
    }
}
