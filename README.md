
# LoL_Store — Full Setup Guide (backend + frontend)

This document contains detailed step-by-step instructions to get the project from a fresh clone to a running development environment on Windows (PowerShell). It covers prerequisites, configuration, database migrations & seeding, running the backend API and the frontend, and troubleshooting.

If you'd prefer a shorter quick-start, see the `Quick start` sections near the top — the rest of this file explains each step in more detail.

## Table of contents
- Prerequisites
- Clone the repository
- Configure environment & secrets
- Build the solution
- Prepare and run the database (EF Core migrations + seeding)
- Run the backend API
- Run the frontend
- Running both together (dev workflow)
- Troubleshooting & common issues
- Next steps and optional improvements

## Prerequisites
Install the following on your machine before continuing:

- .NET SDK 9.0 (required, projects target `net9.0`). Verify installed version:

```powershell
dotnet --version
```

- Node.js (v18+) and npm for the frontend. Verify:

```powershell
node --version
npm --version
```

- SQL database server. You can use one of:
	- SQL Server (LocalDB / Developer / full). Connection string in this repo assumes local SQL Server by default.
	- MySQL (Pomelo provider included but requires provider configuration in `appsettings`/startup). If you plan to use MySQL, update the connection string and provider configuration accordingly.

- Optional but recommended: EF CLI tool to run migrations locally:

```powershell
dotnet tool install --global dotnet-ef
```

Note: If you're on a machine with restricted global tool installs, prefix commands with the appropriate PATH or install only locally per-user.

## Clone the repository
Open PowerShell and clone the repo (or update to your fork):

```powershell
# choose a local path and clone
cd 'D:\Work\Code\Web'
git clone https://github.com/RyunVu/LOL-Store.git
cd LOL-Store
```

The solution root contains `LoL_Store.sln` and the `backend/` and `frontend/` folders.

## Configure environment & secrets
Several settings are kept in `backend/LoLStore.API/appsettings.json`. For local development you can either edit `appsettings.Development.json` or use environment variables or `dotnet user-secrets` to avoid storing secrets in VCS.

Key values to check:

- ConnectionStrings:DefaultConnection — points to your DB server. Default in the repo:

```json
"ConnectionStrings": {
	"DefaultConnection": "Server=(local);Database=LoLStore;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True"
}
```

If you use LocalDB, you may want:

```powershell
"Server=(localdb)\MSSQLLocalDB;Database=LoLStore;Trusted_Connection=True;"
```

- JWT settings (currently in `appsettings.json` for convenience):

```json
"Jwt": {
	"Key": "LoLStoreSecretKey",
	"Issuer": "LoLStore",
	"Audience": "LoLStoreUsers"
}
```

Use `dotnet user-secrets` in the API project to keep secrets out of source control:

```powershell
# In repo root
cd backend\LoLStore.API
# initialize user-secrets (this creates a user-secrets id in the project file)
dotnet user-secrets init
# set the JWT key
dotnet user-secrets set "Jwt:Key" "YourStrongDevSecretHere"
# set connection string if you prefer not to edit appsettings.json
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(local);Database=LoLStore;Trusted_Connection=True;"
```

Alternatively, set environment variables (PowerShell example):

```powershell
# set for current terminal only
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ConnectionStrings__DefaultConnection = 'Server=(localdb)\MSSQLLocalDB;Database=LoLStore;Trusted_Connection=True;'
$env:Jwt__Key = 'YourStrongDevSecretHere'
```

Note: Double underscores (`__`) map into nested configuration keys in .NET environment variables.

## Build the solution
From the repository root run:

```powershell
dotnet restore
dotnet build LoL_Store.sln -c Debug
```

If build fails, read the error and ensure the correct .NET SDK is installed and the PATH is set.

## Prepare the database (EF Core migrations and seeding)

Where things live:
- DbContext, mappings, seeders: `backend/LoLStore.Data/`
- Migrations (existing): `backend/LoLStore.Data/Migrations/`

There are two common scenarios:

1) You just want to apply the existing migrations that come with the repo (most common)

```powershell
# from repo root
# ensure environment variables or user-secrets are set for the connection string
dotnet ef database update --project backend\LoLStore.Data --startup-project backend\LoLStore.API
```

This will apply migrations and create/update the database.

2) You changed the model and need to add a new migration locally

```powershell
# add a new migration (name it appropriately)
dotnet ef migrations add AddNewFieldToProduct --project backend\LoLStore.Data --startup-project backend\LoLStore.API -o Migrations
# then apply
dotnet ef database update --project backend\LoLStore.Data --startup-project backend\LoLStore.API
```

Notes:
- If your DB provider is MySQL, ensure `backend\LoLStore.Data\LoLStore.Data.csproj` has the correct provider and the connection string uses the MySQL URI. The repo includes Pomelo MySQL provider, but the startup/DbContext setup must select the provider accordingly.
- If migrations command fails due to tools version mismatch, ensure `dotnet-ef` is installed and compatible with the SDK version.

Seeding
- The API calls `UseDataSeederAsync()` on startup in `Program.cs`. When you run the API (next section) it will attempt to seed initial data. Check `backend/LoLStore.Data/Seeders` for seed logic and how duplicates are handled.

## Run the backend API (development)
Start the API from the solution root or project folder:

```powershell
# from repo root
dotnet run --project backend\LoLStore.API
```

Important notes:
- The API will read configuration from `appsettings.json`, `appsettings.Development.json` (if environment set to Development), user-secrets, and environment variables.
- Swagger and developer-friendly endpoints may be available when running in Development.
- Watch console logs for messages about seeding and the listening URL(s).

## Run the frontend (Vite + React)
Open another PowerShell window and run:

```powershell
cd frontend
npm install
npm run dev
```

Vite will start the dev server and show an URL (usually `http://localhost:5173`). The API's `appsettings.json` contains an `AllowLocalHost` setting referencing `http://localhost:5173` — ensure the API's CORS settings allow the origin (the API project's startup config reads this value).

## Running both together (dev workflow)
Recommended: run backend and frontend in separate terminal windows so each process has its own logs.

PowerShell example (background jobs):

```powershell
# run API in background (job)
Start-Job -ScriptBlock { dotnet run --project 'D:\Work\Code\Web\LoL_Store\backend\LoLStore.API' }
# run frontend in current window
cd 'D:\Work\Code\Web\LoL_Store\frontend'
npm run dev
```

To stop the API job:

```powershell
Get-Job | Where-Object { $_.State -eq 'Running' } | Stop-Job
```

## Troubleshooting & common issues

- dotnet/SDK issues:
	- Ensure `dotnet --info` shows a compatible SDK.
	- If the wrong SDK is used, consider installing the required version or using global.json to pin.

- EF migrations errors:
	- If migrations report missing types or provider problems, verify project references and package versions in `backend/LoLStore.Data/LoLStore.Data.csproj`.
	- If you switched provider (SQL Server <-> MySQL), consider re-creating migrations since provider-specific SQL may be stored.

- Database connection failures:
	- Confirm the connection string and that your DB server is running and accessible.
	- If using Windows Authentication, ensure the account running the process has DB access.

- CORS errors from the frontend:
	- Ensure `AllowLocalHost` / CORS configuration in API permits the frontend origin. When running frontend on `http://localhost:5173`, ensure that origin is allowed.

- JWT/authentication issues:
	- For local development, ensure `Jwt:Key` is set (via user-secrets or environment variable) and matches what tokens are generated with.

- Logs and diagnostics:
	- The API uses NLog. Check console output or the configured NLog targets.

## Where to look in the codebase
- API project: `backend/LoLStore.API/` — Program.cs, controllers, middleware, auth, swagger.
- Domain models: `backend/LoLStore.Core/Entities/` — Product, Category, User, etc.
- Persistence: `backend/LoLStore.Data/` — DbContext, Mappings, Migrations, Seeders.
- Services/business logic: `backend/LoLStore.Services/` — service classes used by controllers.
- Frontend: `frontend/` — Vite + React app.

## Helpful commands summary (PowerShell)

```powershell
# Build everything
dotnet restore
dotnet build LoL_Store.sln

# Apply existing migrations
dotnet ef database update --project backend\LoLStore.Data --startup-project backend\LoLStore.API

# Add a new migration (if you change models)
dotnet ef migrations add MyMigrationName --project backend\LoLStore.Data --startup-project backend\LoLStore.API -o Migrations

# Run API
dotnet run --project backend\LoLStore.API

# Run frontend
cd frontend; npm install; npm run dev
```

## Next steps and optional improvements
- Create a `backend/README.md` with developer-specific notes (EF tips, seeding details, where to add indexes like SKU uniqueness).
- Add `docker-compose.yml` to run SQL Server/MySQL, API, and frontend together for consistent local dev.
- Move secrets into environment variables or a secrets manager for production.

If you want, I can now:
- add a `backend/README.md` with EF examples and local connection string templates, or
- create a `docker-compose.yml` that includes SQL Server + API + frontend for local dev, or
- update `Product` entity to add data annotations and add a unique index migration for `Sku`.

---

If you'd like me to implement one of the optional improvements above, pick one and I will make the changes and run a quick verification build/migration.

---

If you'd like, I can:
- add a short `backend/README.md` with specific EF instructions and a sample `appsettings.Development.json` for local dev, or
- add a `dotnet user-secrets` example to keep the JWT secret out of source control, or
- create a Docker Compose file to run the SQL Server + API + frontend together.

Tell me which follow-up you prefer and I will implement it.
