namespace Heartoza.Services
{
    public interface IEmailSender
    {
        Task SendAsync(string to, string subject, string html);
    }

    public class DevEmailSender : IEmailSender
    {
        public Task SendAsync(string to, string subject, string html)
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine($"[DEV MAIL] To: {to}\nSubject: {subject}\nBody:\n{html}\n");
            Console.ResetColor();
            return Task.CompletedTask;
        }
    }
}
