using Microsoft.Extensions.Options;

namespace LoLStore.API.Media;

public class LocalFileSystemMediaManager : IMediaManager
{
    private readonly ILogger<LocalFileSystemMediaManager> _logger;
    private readonly IWebHostEnvironment _env;
    private readonly MediaOptions _options;

    public LocalFileSystemMediaManager(
        ILogger<LocalFileSystemMediaManager> logger,
        IWebHostEnvironment env,
        IOptions<MediaOptions> options)
    {
        _logger = logger;
        _env = env ?? throw new ArgumentNullException(nameof(env));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<string> SaveFileAsync(Stream input, string originalFileName, string contentType, CancellationToken cancellationToken = default)
    {
        if (input == null) throw new ArgumentNullException(nameof(input));
        if (string.IsNullOrWhiteSpace(originalFileName)) throw new ArgumentException("Original file name is required", nameof(originalFileName));

        var fileExtension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(fileExtension) || _options.AllowedExtensions == null || !_options.AllowedExtensions.Contains(fileExtension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("File extension is not allowed.");
        }

        if (!string.IsNullOrWhiteSpace(contentType) && (_options.AllowedContentTypes == null || !_options.AllowedContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("Content type is not allowed.");
        }

        var uploadRoot = Path.GetFullPath(Path.Combine(_env.WebRootPath ?? Path.Combine(Environment.CurrentDirectory, "wwwroot"), _options.UploadsFolder ?? "uploads/pictures"));
        var uniqueName = $"{Guid.NewGuid():N}{fileExtension}";
        var fullPath = Path.Combine(uploadRoot, uniqueName);

        var fullPathNormalized = Path.GetFullPath(fullPath);
        if (!fullPathNormalized.StartsWith(uploadRoot, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid target path.");

        Directory.CreateDirectory(Path.GetDirectoryName(fullPathNormalized) ?? uploadRoot);

        // Read header bytes for signature check (do not require seekable stream)
        var headerSize = 16; // enough for common image signatures
        var headerBuffer = new byte[headerSize];
        var headerRead = 0;
        while (headerRead < headerSize)
        {
            var read = await input.ReadAsync(headerBuffer.AsMemory(headerRead, headerSize - headerRead), cancellationToken).ConfigureAwait(false);
            if (read == 0) break;
            headerRead += read;
        }

        // check size of headerless small streams
        long total = headerRead;
        if (_options.MaxFileSizeBytes.HasValue && total > _options.MaxFileSizeBytes.Value)
        {
            throw new InvalidOperationException("File too large.");
        }

        if (_options.ValidateMagicBytes.GetValueOrDefault(false) && !_HasValidSignature(headerBuffer, headerRead, fileExtension))
        {
            throw new InvalidOperationException("File signature does not match expected format.");
        }

        try
        {
            // Create new file and write header + remaining stream
            await using var fs = new FileStream(fullPathNormalized, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous);

            if (headerRead > 0)
            {
                await fs.WriteAsync(headerBuffer.AsMemory(0, headerRead), cancellationToken).ConfigureAwait(false);
            }

            var buffer = new byte[81920];
            int readBytes;
            while ((readBytes = await input.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken).ConfigureAwait(false)) > 0)
            {
                total += readBytes;
                if (_options.MaxFileSizeBytes.HasValue && total > _options.MaxFileSizeBytes.Value)
                {
                    await fs.DisposeAsync().ConfigureAwait(false);
                    File.Delete(fullPathNormalized);
                    throw new InvalidOperationException("File too large.");
                }

                await fs.WriteAsync(buffer.AsMemory(0, readBytes), cancellationToken).ConfigureAwait(false);
            }

            var relative = Path.GetRelativePath(_env.WebRootPath ?? Path.Combine(Environment.CurrentDirectory, "wwwroot"), fullPathNormalized)
                .Replace(Path.DirectorySeparatorChar, '/');

            return relative;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving file {FileName}", originalFileName);
            throw;
        }
    }

    public Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePath)) return Task.FromResult(true);

        try
        {
            var root = Path.GetFullPath(Path.Combine(_env.WebRootPath ?? Path.Combine(Environment.CurrentDirectory, "wwwroot"), _options.UploadsFolder ?? "uploads/pictures"));
            var full = Path.GetFullPath(Path.Combine(_env.WebRootPath ?? Path.Combine(Environment.CurrentDirectory, "wwwroot"), filePath));

            if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Attempted to delete file outside of uploads root: {FilePath}", filePath);
                return Task.FromResult(false);
            }

            if (File.Exists(full)) File.Delete(full);
            return Task.FromResult(true);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Could not delete file '{FilePath}'", filePath);
            return Task.FromResult(false);
        }
    }

    private static bool _HasValidSignature(byte[] header, int length, string extension)
    {
        if (extension == null) return false;
        extension = extension.ToLowerInvariant();

        // JPEG: FF D8 FF
        if ((extension == ".jpg" || extension == ".jpeg") && length >= 3)
            return header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (extension == ".png" && length >= 8)
            return header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;

        // GIF: GIF87a or GIF89a
        if (extension == ".gif" && length >= 6)
            return header[0] == (byte)'G' && header[1] == (byte)'I' && header[2] == (byte)'F';

        // WEBP: 'RIFF' .... 'WEBP' (check first 4 bytes and bytes 8-11)
        if (extension == ".webp" && length >= 12)
            return header[0] == (byte)'R' && header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'F'
                   && header[8] == (byte)'W' && header[9] == (byte)'E' && header[10] == (byte)'B' && header[11] == (byte)'P';

        // For unknown, be permissive (but extension check already done)
        return true;
    }
}
