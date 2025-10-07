namespace Heartoza.Services
{
    public class AzureStorageOptions
    {
        public string? ConnectionString { get; set; }
        public string Container { get; set; } = "avatars";
        public string? BaseUrl { get; set; }
    }

}
