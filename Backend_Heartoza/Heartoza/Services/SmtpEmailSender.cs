using Heartoza.Services;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _cfg;
    public SmtpEmailSender(IConfiguration cfg) => _cfg = cfg;

    public async Task SendAsync(string to, string subject, string html)
    {
        var sec = _cfg.GetSection("Email");
        using var client = new SmtpClient(sec["SmtpHost"], int.Parse(sec["SmtpPort"]))
        {
            Credentials = new NetworkCredential(sec["User"], sec["Pass"]),
            EnableSsl = bool.Parse(sec["EnableSsl"])
        };

        var mail = new MailMessage(sec["User"], to, subject, html)
        {
            IsBodyHtml = true
        };

        await client.SendMailAsync(mail);
    }
}
