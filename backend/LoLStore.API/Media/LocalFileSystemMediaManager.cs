using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace LoLStore.API.Media;

public class LocalFileSystemMediaManager : IMediaManager
{
    private const string PicturesFolder = "uploads/pictures/{0}{1}";
    private readonly ILogger<LocalFileSystemMediaManager> _logger;

    public LocalFileSystemMediaManager(ILogger<LocalFileSystemMediaManager> logger)
    {
        _logger = logger;
    }

    public async Task<string> SaveFileAsync(Stream buffer, string originalFileName, string contentType, CancellationToken cancellationToken = default)
    {
        if (buffer == null || !buffer.CanRead || !buffer.CanSeek || buffer.Length == 0)
            return null;

        try
        {
            var fileExtension = Path.GetExtension(originalFileName).ToLowerInvariant();
            var returnFilePath = CreateFilePath(fileExtension, contentType.ToLowerInvariant());
            var fullPath = Path.Combine(Environment.CurrentDirectory, "wwwroot", returnFilePath);

            // Ensure directory exists
            var directory = Path.GetDirectoryName(fullPath);
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            buffer.Position = 0;

            await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
            await buffer.CopyToAsync(fileStream, cancellationToken).ConfigureAwait(false);

            return returnFilePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving file {FileName}", originalFileName);
            throw;
        }
    }

    private static string CreateFilePath(string fileExtension, string contentType)
    {
        var uniqueFileName = Guid.NewGuid().ToString("N");
        return string.Format(PicturesFolder, uniqueFileName, fileExtension);
    }

    public Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePath))
            return Task.FromResult(true);

        try
        {
            var fullPath = Path.Combine(Environment.CurrentDirectory, "wwwroot", filePath);

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.FromResult(true);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Could not delete file '{FilePath}'", filePath);
            return Task.FromResult(false);
        }
    }
}
