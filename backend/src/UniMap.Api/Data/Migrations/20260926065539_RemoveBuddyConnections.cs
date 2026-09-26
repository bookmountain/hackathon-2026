using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBuddyConnections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "buddy_connections");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "buddy_connections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    addressee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requester_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_buddy_connections", x => x.id);
                    table.ForeignKey(
                        name: "fk_buddy_connections_users_addressee_id",
                        column: x => x.addressee_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_buddy_connections_users_requester_id",
                        column: x => x.requester_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_buddy_connections_addressee_id",
                table: "buddy_connections",
                column: "addressee_id");

            migrationBuilder.CreateIndex(
                name: "ix_buddy_connections_requester_id_addressee_id",
                table: "buddy_connections",
                columns: new[] { "requester_id", "addressee_id" },
                unique: true);
        }
    }
}
