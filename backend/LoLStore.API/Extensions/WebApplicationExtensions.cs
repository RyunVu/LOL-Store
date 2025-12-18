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

        builder.Services.AddDbContext<StoreDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        builder.Services.AddScoped<IMediaManager, LocalFileSystemMediaManager>();
        builder.Services.AddScoped<IDataSeeder, DataSeeder>();
        builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

        builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();

        return builder;
    }

    public static WebApplicationBuilder ConfigureCors(this WebApplicationBuilder builder)
    {
        builder.Services.AddCors(option =>
            option.AddPolicy("LoLStoreApp", policyBuilder =>
                policyBuilder
                    .WithOrigins(builder.Configuration["AllowLocalHost"] ?? "")
                    .AllowCredentials()
                    .AllowAnyHeader()
                    .AllowAnyMethod()));
        return builder;
    }

    public static WebApplicationBuilder ConfigureAuthenticationAndAuthorization(this WebApplicationBuilder builder)
    {
        var jwtKey = builder.Configuration["Jwt:Key"]
                        ?? throw new InvalidOperationException("JWT Key is not configured.");

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
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

    public static WebApplication SetupMiddleware(this WebApplication app)
    {
        app.UseMiddleware<StatusCodeResponseMiddleware>();
        return app;
    }

    public static WebApplication SetupRequestPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "LoL Store API v1");
                c.RoutePrefix = string.Empty;
            });
        }

        app.UseCors("LoLStoreApp");
        app.UseStaticFiles();
        app.UseHttpsRedirection();

        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }
}
