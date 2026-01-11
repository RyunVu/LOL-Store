using System.Reflection;
using System.Security.Claims;
using System.Text;
using LoLStore.API.Media;
using LoLStore.API.Middlewares;
using LoLStore.Data.Contexts;
using LoLStore.Services.Shop;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NLog.Web;

namespace LoLStore.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplicationBuilder ConfigureServices(this WebApplicationBuilder builder)
    {
        builder.Services.AddMemoryCache();

        // Media options - file uploads configuration
        builder.Services.Configure<MediaOptions>(builder.Configuration.GetSection("Media"));
        // Defaults in case configuration section is missing
        builder.Services.PostConfigure<MediaOptions>(opt =>
        {
            opt.UploadsFolder ??= "uploads/pictures";
            opt.MaxFileSizeBytes ??= 5 * 1024 * 1024; // 5 MB
            opt.AllowedExtensions ??= new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            opt.AllowedContentTypes ??= new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            opt.ValidateMagicBytes ??= true;
        });

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is not configured."
            );
        }

        builder.Services.AddDbContext<StoreDbContext>(options =>
            options.UseSqlServer(connectionString)
        );

        builder.Services.AddScoped<IMediaManager, LocalFileSystemMediaManager>();
        builder.Services.AddScoped<IDataSeeder, DataSeeder>();
        builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

        builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
        builder.Services.AddScoped<IProductRepository, ProductRepository>();
        builder.Services.AddScoped<IOrderRepository, OrderRepository>();
        builder.Services.AddScoped<IDiscountRepository, DiscountRepository>();
        builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();

        return builder;
    }

       public static WebApplicationBuilder ConfigureCors(this WebApplicationBuilder builder)
    {
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("DevCors", policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return builder;
    }
    

    public static WebApplicationBuilder ConfigureAuthenticationAndAuthorization(this WebApplicationBuilder builder)
    {
        var jwtKey = builder.Configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Key is missing or too short. Use a minimum 32-character secret via env vars or user-secrets."
            );
        }

        var issuer = builder.Configuration["Jwt:Issuer"];
        var audience = builder.Configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException(
                "Jwt:Issuer or Jwt:Audience is not configured."
            );
        }

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    RoleClaimType = ClaimTypes.Role
                };
            });

        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
            options.AddPolicy("RequireManagerRole", policy => policy.RequireRole("Manager"));
        });

        return builder;
    }

    public static WebApplicationBuilder ConfigureSwagger(this WebApplicationBuilder builder)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "LoL Store API",
                Version = "v1"
            });

            var jwtSecurityScheme = new OpenApiSecurityScheme
            {
                Scheme = "bearer",
                BearerFormat = "JWT",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Description = "Enter: Bearer {your JWT token}",

                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            };

            c.AddSecurityDefinition("Bearer", jwtSecurityScheme);

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                { jwtSecurityScheme, Array.Empty<string>() }
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
            }
        });

        return builder;
    }

    public static WebApplicationBuilder ConfigureNLog(this WebApplicationBuilder builder)
    {
        builder.Host.UseNLog(new NLogAspNetCoreOptions
        {
            RemoveLoggerFactoryFilter = true
        });
        builder.Logging.SetMinimumLevel(LogLevel.Trace);

        return builder;
    }

    public static async Task<IApplicationBuilder> UseDataSeederAsync(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        try
        {
            var seeder = scope.ServiceProvider.GetRequiredService<IDataSeeder>();
            await seeder.InitializeAsync();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Failed to seed database");
        }

        return app;
    }

    public static WebApplication SetupContext(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            context.Request.EnableBuffering();

            var length = context.Request.ContentLength;
            if (length is > 0 and > 33_554_432)
            {
                context.Response.StatusCode = StatusCodes.Status413RequestEntityTooLarge;
                await context.Response.WriteAsync("Request body too large");
                return;
            }

            await next();
        });

        return app;
    }
}