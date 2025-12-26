using LoLStore.API.Extensions;
using LoLStore.API.Mapsters;
using LoLStore.API.Endpoints;
using LoLStore.API.Validations;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    DotNetEnv.Env.Load();
}

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

var shouldSeed =
    builder.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("SEED_DATABASE");

if (shouldSeed)
{
    app.Logger.LogWarning("Database seeding is ENABLED");
    await app.UseDataSeederAsync();
}

app.SetupContext()
    .SetupMiddleware()
    .SetupRequestPipeline()
    .MapCategoriesEndpoint()
    .MapAccountEndpoints()
    .MapSupplierEndpoint();

app.Run();