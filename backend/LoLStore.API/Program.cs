using LoLStore.API.Extensions;
using LoLStore.API.Media;
using LoLStore.API.Middlewares;
using LoLStore.Data.Contexts;

var builder = WebApplication.CreateBuilder(args);

builder
    .ConfigureServices()
    .ConfigureCors()
    .ConfigureAuthenticationAndAuthorization()
    .ConfigureSwagger()
    .ConfigureNLog();

builder.Services.AddControllers();

var app = builder.Build();

await app.UseDataSeederAsync();

app.SetupContext()
    .SetupMiddleware()
    .SetupRequestPipeline()
    .MapControllers();

app.Run();
