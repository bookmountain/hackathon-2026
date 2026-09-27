using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMap.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UseDailyCardNameInChats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The daily card's first message used another app's name; say "Daily card" like the rest of UCompass
            migrationBuilder.Sql(
                """
                UPDATE chat_messages
                SET body = replace(replace(body, 'We drew each other on Dcard today', 'We matched on the Daily card today'),
                                   'Dcard', 'Daily card')
                WHERE body LIKE '%Dcard%';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nothing to undo: the old name isn't brought back
        }
    }
}
