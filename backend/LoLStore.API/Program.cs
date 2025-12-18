using LoLStore.API.Extensions;
using LoLStore.API.Mapsters;
using LoLStore.API.Endpoints;
using LoLStore.API.Validations;

var builder = WebApplication.CreateBuilder(args);

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

await app.UseDataSeederAsync(); 

app.SetupContext()
    .SetupMiddleware()
    .SetupRequestPipeline()
    .MapCategoriesEndpoint()
    .MapAccountEndpoints()
    .MapSupplierEndpoint();

app.Run();