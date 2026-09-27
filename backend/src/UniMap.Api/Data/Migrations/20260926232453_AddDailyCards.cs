using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyCards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "daily_draws",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day = table.Column<DateOnly>(type: "date", nullable: false),
                    matched_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    drawn_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    session_restart = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_daily_draws", x => x.id);
                    table.ForeignKey(
                        name: "fk_daily_draws_users_matched_user_id",
                        column: x => x.matched_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_daily_draws_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_daily_draws_day_drawn_at",
                table: "daily_draws",
                columns: new[] { "day", "drawn_at" });

            migrationBuilder.CreateIndex(
                name: "ix_daily_draws_matched_user_id",
                table: "daily_draws",
                column: "matched_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_daily_draws_user_id_day",
                table: "daily_draws",
                columns: new[] { "user_id", "day" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_draws");
        }
    }
}
