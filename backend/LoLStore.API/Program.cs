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

app.UseGlobalExceptionHandler();

var shouldSeed =
    builder.Environment.IsDevelopment() ||
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
}

app.UseCors("DevCors");

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<StatusCodeResponseMiddleware>();

app.MapCategoriesEndpoint();
app.MapAccountEndpoints();
app.MapSupplierEndpoint();
app.MapProductEndpoint();
app.MapOrdersEndpoint();
app.MapDiscountEndpoint();
app.MapDashboardEndpoint();

app.Run();