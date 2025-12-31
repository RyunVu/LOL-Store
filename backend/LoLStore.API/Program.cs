using LoLStore.API.Extensions;
using LoLStore.API.Mapsters;
using LoLStore.API.Endpoints;
using LoLStore.API.Validations;
using LoLStore.API.Middlewares;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    DotNetEnv.Env.Load();
}

builder.Configuration.AddEnvironmentVariables();

builder
    .ConfigureCors()
    .ConfigureNLog()
    .ConfigureServices()
    .ConfigureSwagger()
    .ConfigureAuthenticationAndAuthorization()
    .ConfigureMapster()
    .ConfigureFluentValidation(); 

builder.Services.AddControllers();

var app = builder.Build();

// Global exception handling (should be early)
app.UseGlobalExceptionHandler();

var shouldSeed =
    builder.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("SEED_DATABASE");

if (shouldSeed)
{
    app.Logger.LogWarning("Database seeding is ENABLED");
    await app.UseDataSeederAsync();
}

// Context + base middleware
app.SetupContext();


// Auth must come BEFORE status code middleware
app.UseAuthentication();
app.UseAuthorization();

// Custom middleware to normalize 401 / 403 responses
app.UseMiddleware<StatusCodeResponseMiddleware>();

// Remaining pipeline
app.SetupMiddleware()
    .SetupRequestPipeline();

// Map endpoints
app.MapCategoriesEndpoint();
app.MapAccountEndpoints();
app.MapSupplierEndpoint();
app.MapProductEndpoint();


app.Run();