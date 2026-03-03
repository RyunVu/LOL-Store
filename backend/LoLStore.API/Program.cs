using LoLStore.API.Extensions;
using LoLStore.API.Mapsters;
using LoLStore.API.Endpoints;
using LoLStore.API.Validations;
using LoLStore.API.Middlewares;
using LoLStore.Data.Seeders;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


builder.Configuration.AddEnvironmentVariables();

builder
    .ConfigureCors()
    .ConfigureNLog()
    .ConfigureServices()
    .ConfigureSwagger()
    .ConfigureAuthenticationAndAuthorization()
    .ConfigureMapster()
    .ConfigureFluentValidation(); 

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()
        );
    });

var app = builder.Build();

app.UseGlobalExceptionHandler();

var shouldSeed =
    builder.Configuration.GetValue<bool>("SEED_DATABASE");

if (shouldSeed)
{
    app.Logger.LogWarning("Database seeding is ENABLED");
    await app.UseDataSeederAsync();
}

app.SetupContext();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "LoL Store API v1");
        c.RoutePrefix = string.Empty;
    });

    using var scope = app.Services.CreateScope();
    var devSeeder = scope.ServiceProvider.GetRequiredService<ExtraProduct>();
    await devSeeder.SeedExtraProductsAsync();
}

app.UseCors("DevCors");

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiniProfiler();

app.UseMiddleware<StatusCodeResponseMiddleware>();

app.MapCategoriesEndpoint();
app.MapAccountEndpoints();
app.MapSupplierEndpoint();
app.MapProductEndpoint();
app.MapOrdersEndpoint();
app.MapDiscountEndpoint();
app.MapDashboardEndpoint();

app.Run();