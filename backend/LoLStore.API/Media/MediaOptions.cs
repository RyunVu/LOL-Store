namespace LoLStore.API.Media;

public class MediaOptions
{
    // Relative folder inside webroot where uploads are stored, e.g. "uploads/pictures"
    public string? UploadsFolder { get; set; }

    // Max allowed file size in bytes (null = no limit)
    public long? MaxFileSizeBytes { get; set; }

    // Allowed file extensions (including leading dot): .jpg, .png ...
    public string[]? AllowedExtensions { get; set; }

    // Allowed content types as reported by client
    public string[]? AllowedContentTypes { get; set; }

    // Whether to validate file magic bytes / signatures
    public bool? ValidateMagicBytes { get; set; }
}