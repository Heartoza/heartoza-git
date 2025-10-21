using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Heartoza.Services;
using Microsoft.Extensions.Options;

public class BlobAvatarStorage : IAvatarStorage
{
    private readonly BlobContainerClient _container;
    private readonly string? _baseUrl;

    public BlobAvatarStorage(IOptions<AzureStorageOptions> opt)
    {
        var o = opt.Value;
        _baseUrl = o.BaseUrl;
        _container = new BlobContainerClient(o.ConnectionString, o.Container);
        _container.CreateIfNotExists(PublicAccessType.Blob);
    }

    public async Task<string> UploadAsync(Stream file, string contentType, string fileName, CancellationToken ct)
    {
        // đặt tên file duy nhất
        var ext = Path.GetExtension(fileName);
        var blobName = $"{Guid.NewGuid():N}{ext}".ToLowerInvariant();

        var blobClient = _container.GetBlobClient(blobName);

        await blobClient.UploadAsync(file, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        }, ct);

        // nếu có BaseUrl (đã config trong env), trả về URL đẹp
        if (!string.IsNullOrWhiteSpace(_baseUrl))
            return $"{_baseUrl.TrimEnd('/')}/{blobName}";

        // fallback: dùng URL mặc định
        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string blobName, CancellationToken ct)
    {
        await _container.DeleteBlobIfExistsAsync(
            blobName,
            DeleteSnapshotsOption.IncludeSnapshots,
            cancellationToken: ct
        );
    }
    public string GenerateReadSasUrl(string blobName, int expireMinutes = 10)
    {
        // Nếu container chưa public và không có quyền tạo SAS bằng key
        // (ví dụ đang dùng Managed Identity), cần dùng User Delegation SAS.
        // Còn nếu ConnectionString có AccountKey thì tạo SAS dễ hơn.
        var blobClient = _container.GetBlobClient(blobName);

        if (!_container.CanGenerateSasUri)
            throw new InvalidOperationException("Storage client không có quyền tạo SAS. Cần AccountKey hoặc UDS.");

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _container.Name,
            BlobName = blobName,
            Resource = "b", // blob
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expireMinutes)
        };

        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        Uri sasUri = blobClient.GenerateSasUri(sasBuilder);
        return sasUri.ToString();
    }
}
