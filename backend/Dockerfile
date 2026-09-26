# Production image (multi-stage). Not used by docker-compose.yml's dev setup.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/UniMap.Api/UniMap.Api.csproj src/UniMap.Api/
RUN dotnet restore src/UniMap.Api/UniMap.Api.csproj
COPY src/ src/
RUN dotnet publish src/UniMap.Api -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "UniMap.Api.dll"]
