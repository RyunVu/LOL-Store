using Slugify;

namespace LoLStore.Services.Extensions;

public static class GenerateSlugFromName
{
    public static string GenerateSlug(this string input)
    {
        var slugHelper = new SlugHelper();
        return slugHelper.GenerateSlug(input);
    }
}