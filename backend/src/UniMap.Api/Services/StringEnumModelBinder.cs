using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace UniMap.Api.Services;

/// <summary>
/// Enums in the query string or route must be sent by name (case-insensitive), like in JSON bodies.
/// The default binder also accepts numbers, so "?category=2" would silently mean Furniture.
/// </summary>
public class StringEnumModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        var type = Nullable.GetUnderlyingType(context.Metadata.ModelType) ?? context.Metadata.ModelType;
        return type.IsEnum ? new StringEnumModelBinder(type) : null;
    }
}

public class StringEnumModelBinder(Type enumType) : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext ctx)
    {
        var value = ctx.ValueProvider.GetValue(ctx.ModelName);
        if (value == ValueProviderResult.None) return Task.CompletedTask;
        ctx.ModelState.SetModelValue(ctx.ModelName, value);

        var text = value.FirstValue?.Trim();
        if (string.IsNullOrEmpty(text))
        {
            // Like the default binder: "?category=" means not sent for an optional enum.
            if (Nullable.GetUnderlyingType(ctx.ModelType) is not null)
                ctx.Result = ModelBindingResult.Success(null);
            else
            {
                ctx.ModelState.TryAddModelError(ctx.ModelName, $"A value is required. Use one of: {string.Join(", ", Enum.GetNames(enumType))}.");
                ctx.Result = ModelBindingResult.Failed();
            }
            return Task.CompletedTask;
        }

        var name = Enum.GetNames(enumType).FirstOrDefault(n => n.Equals(text, StringComparison.OrdinalIgnoreCase));
        if (name is null)
        {
            ctx.ModelState.TryAddModelError(ctx.ModelName,
                $"The value '{text}' is not valid. Use one of: {string.Join(", ", Enum.GetNames(enumType))}.");
            ctx.Result = ModelBindingResult.Failed();
            return Task.CompletedTask;
        }

        ctx.Result = ModelBindingResult.Success(Enum.Parse(enumType, name));
        return Task.CompletedTask;
    }
}
