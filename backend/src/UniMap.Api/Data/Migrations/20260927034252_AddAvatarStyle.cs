using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarStyle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing profiles get the builder's defaults: initials in a circle, no ring
            migrationBuilder.AddColumn<string>(
                name: "avatar_icon",
                table: "profiles",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Compass");

            migrationBuilder.AddColumn<string>(
                name: "avatar_mode",
                table: "profiles",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Initials");

            migrationBuilder.AddColumn<string>(
                name: "avatar_ring",
                table: "profiles",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<string>(
                name: "avatar_shape",
                table: "profiles",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Circle");

            migrationBuilder.AddColumn<string>(
                name: "avatar_text",
                table: "profiles",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "avatar_icon",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "avatar_mode",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "avatar_ring",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "avatar_shape",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "avatar_text",
                table: "profiles");
        }
    }
}
