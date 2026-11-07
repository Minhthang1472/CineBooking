using HotelManagementApi.Models;

namespace HotelManagementApi.Helpers;

public static class PasswordHelper
{
    public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public static bool Verify(User user, string password)
    {
        if (user.PasswordHash.StartsWith("$2a$", StringComparison.Ordinal) ||
            user.PasswordHash.StartsWith("$2b$", StringComparison.Ordinal) ||
            user.PasswordHash.StartsWith("$2y$", StringComparison.Ordinal))
        {
            return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }

        return user.PasswordHash == password;
    }
}
