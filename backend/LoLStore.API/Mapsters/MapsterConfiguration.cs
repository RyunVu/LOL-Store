using LoLStore.API.Models.CategoryModel;
using LoLStore.Core.Entities;
using Mapster;

namespace LoLStore.API.Mapsters;

public class MapsterConfiguration : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Category, CategoryDto>()
            .Map(dest => dest.ProductCount,
              src => src.Products == null ? 0 : src.Products.Count);

    }
}