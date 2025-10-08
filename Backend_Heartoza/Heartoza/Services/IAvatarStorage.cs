namespace Heartoza.Services
{
    public interface IAvatarStorage
    {
        Task<string> UploadAsync(Stream file, string contentType, string fileName, CancellationToken ct);
        Task DeleteAsync(string blobName, CancellationToken ct);
    }

}
