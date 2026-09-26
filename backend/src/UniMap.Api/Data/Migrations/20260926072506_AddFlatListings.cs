using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFlatListings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "flat_listings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    suburb = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    street = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    location = table.Column<Point>(type: "geography (point, 4326)", nullable: false),
                    rent_per_week = table.Column<int>(type: "integer", nullable: false),
                    bills_per_week = table.Column<int>(type: "integer", nullable: false),
                    bedrooms = table.Column<int>(type: "integer", nullable: false),
                    flatmates = table.Column<int>(type: "integer", nullable: false),
                    toilet = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    bathroom = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    furnished = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    min_stay_months = table.Column<int>(type: "integer", nullable: true),
                    available_from = table.Column<DateOnly>(type: "date", nullable: true),
                    features = table.Column<List<string>>(type: "text[]", nullable: false),
                    house_rhythm = table.Column<List<string>>(type: "text[]", nullable: false),
                    preferred_flatmate = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    housemates = table.Column<List<string>>(type: "text[]", nullable: false),
                    photo_keys = table.Column<List<string>>(type: "text[]", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_flat_listings", x => x.id);
                    table.ForeignKey(
                        name: "fk_flat_listings_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_flat_listings_features",
                table: "flat_listings",
                column: "features")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "ix_flat_listings_location",
                table: "flat_listings",
                column: "location")
                .Annotation("Npgsql:IndexMethod", "gist");

            migrationBuilder.CreateIndex(
                name: "ix_flat_listings_owner_id",
                table: "flat_listings",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_flat_listings_status_rent_per_week",
                table: "flat_listings",
                columns: new[] { "status", "rent_per_week" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "flat_listings");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:postgis", ",,");
        }
    }
}
