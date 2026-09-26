using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDegrees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "degree_id",
                table: "profiles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "degrees",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    university = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    level = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    award_type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    college = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    campuses = table.Column<List<string>>(type: "text[]", nullable: false),
                    is_double_degree = table.Column<bool>(type: "boolean", nullable: false),
                    url = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_degrees", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_profiles_degree_id",
                table: "profiles",
                column: "degree_id");

            migrationBuilder.CreateIndex(
                name: "ix_degrees_university_level_college",
                table: "degrees",
                columns: new[] { "university", "level", "college" });

            migrationBuilder.CreateIndex(
                name: "ix_degrees_university_level_name",
                table: "degrees",
                columns: new[] { "university", "level", "name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_profiles_degrees_degree_id",
                table: "profiles",
                column: "degree_id",
                principalTable: "degrees",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_profiles_degrees_degree_id",
                table: "profiles");

            migrationBuilder.DropTable(
                name: "degrees");

            migrationBuilder.DropIndex(
                name: "ix_profiles_degree_id",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "degree_id",
                table: "profiles");
        }
    }
}
