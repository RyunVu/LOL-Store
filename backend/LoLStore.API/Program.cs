using LoLStore.API.Extensions;
using LoLStore.API.Mapsters;
using LoLStore.API.Endpoints;
using LoLStore.API.Validations;
using FluentValidation;

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

app.SetupContext()
    .SetupMiddleware()
    .SetupRequestPipeline()
    .MapCategoriesEndpoint()
    .MapAccountEndpoints();

app.Run();