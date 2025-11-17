using LoLStore.API.Extensions;
using LoLStore.API.Mapsters;
using LoLStore.API.Endpoints;
using LoLStore.API.Validations;

var builder = WebApplication.CreateBuilder(args);

builder
    .ConfigureCors()
    .ConfigureNLog()
    .ConfigureServices()
    .ConfigureSwaggerOpenApi()
    .ConfigureMapster()
    .ConfigureFluentValidation();


builder.Services.AddControllers();

var app = builder.Build();

// await app.UseDataSeederAsync();

app.SetupContext()
    .SetupMiddleware()
    .SetupRequestPipeline()

    // Config endpoints 
    .MapCategoriesEndpoint();

app.Run();
