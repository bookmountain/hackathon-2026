using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "market_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    seller_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    price = table.Column<int>(type: "integer", nullable: false),
                    category = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    condition = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    condition_note = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    availability = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    available_from = table.Column<DateOnly>(type: "date", nullable: true),
                    pickup_point_id = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    place_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    location = table.Column<Point>(type: "geography (point, 4326)", nullable: false),
                    photo_keys = table.Column<List<string>>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_market_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_market_items_users_seller_id",
                        column: x => x.seller_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_market_items_availability_category_created_at",
                table: "market_items",
                columns: new[] { "availability", "category", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_market_items_location",
                table: "market_items",
                column: "location")
                .Annotation("Npgsql:IndexMethod", "gist");

            migrationBuilder.CreateIndex(
                name: "ix_market_items_pickup_point_id",
                table: "market_items",
                column: "pickup_point_id");

            migrationBuilder.CreateIndex(
                name: "ix_market_items_seller_id",
                table: "market_items",
                column: "seller_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "market_items");
        }
    }
}
