using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using StackExchange.Redis;
using UniMap.Api.Data;
using UniMap.Api.Options;
using UniMap.Api.Services;
using UniMap.Api.Swagger;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// --- Options ---
builder.Services.Configure<JwtOptions>(config.GetSection("Jwt"));
builder.Services.Configure<UniversityOptions>(config.GetSection("Universities"));
builder.Services.Configure<R2Options>(config.GetSection("R2"));
builder.Services.Configure<EmailOptions>(config.GetSection("Email"));

// --- Infrastructure ---
builder.Services.AddDbContext<AppDbContext>(o => o
    .UseNpgsql(config.GetConnectionString("Postgres"))
    .UseSnakeCaseNamingConvention());

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(config.GetConnectionString("Redis")!));

// --- App services ---
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<VerificationCodeStore>();
builder.Services.AddSingleton<StorageService>();
if (config.GetSection("Email").Get<EmailOptions>()?.IsConfigured == true)
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
else
    builder.Services.AddSingleton<IEmailSender, LoggingEmailSender>();
builder.Services.AddScoped<MatchingService>();

// --- Auth ---
var jwt = config.GetSection("Jwt").Get<JwtOptions>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
        };
    });
builder.Services.AddAuthorization();

// --- Web ---
builder.Services.AddControllers()
    // allowIntegerValues: false, otherwise "22" or 22 is accepted as an (undefined) enum value.
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false)));
builder.Services.AddProblemDetails();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(config.GetSection("Cors:Origins").Get<string[]>() ?? [])
    .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new OpenApiInfo { Title = "UniMap API", Version = "v1" });
    o.SchemaFilter<RequestExamplesFilter>();
    // Lets enum/object properties carry their own description and "deprecated" flag.
    o.UseAllOfToExtendReferenceSchemas();
    o.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml"));
    o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Paste the accessToken from /api/auth/login or /api/auth/verify",
    });
    o.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", doc)] = [],
    });
});

var app = builder.Build();

// Apply EF migrations on startup — fine for a hackathon, do it in CI/CD for anything real.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DegreeSeeder.SeedAsync(db, app.Logger);
    if (app.Environment.IsDevelopment() || config.GetValue<bool>("Seed:Enabled"))
        await DevSeeder.SeedAsync(db, app.Logger);
}

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment() || config.GetValue<bool>("EnableSwagger"))
{
    app.UseSwagger();
    app.UseSwaggerUI(o => o.EnablePersistAuthorization());
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();
