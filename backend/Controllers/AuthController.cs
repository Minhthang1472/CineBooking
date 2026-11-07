using HotelManagementApi.Models;
using HotelManagementApi.Helpers;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(HotelDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // 1. Tìm user trong database (Dựa theo dữ liệu mẫu trong file SQL của bạn)
            var user = await _context.Users
                .Include(u => u.Role) // Lấy kèm thông tin chức vụ (Admin, Guest...)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            // 2. Kiểm tra tài khoản và mật khẩu
            // Lưu ý: Trong SQL mẫu của bạn, mật khẩu đang lưu là "hash1", "hash2"...
            if (user == null || !PasswordHelper.Verify(user, request.Password))
            {
                return Unauthorized(new { Message = "Email hoặc mật khẩu không đúng!" });
            }

            // 3. Tạo các thông tin (Claims) để nhét vào Token
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "Guest")
            };

            // 4. Mã hóa Token
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Token có hạn 2 tiếng
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Ghi audit log đăng nhập thành công
            try
            {
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId    = user.Id,
                    Action    = "LOGIN",
                    TableName = "Hệ Thống",
                    RecordId  = user.Id,
                    NewValue  = System.Text.Json.JsonSerializer.Serialize(new { role = user.Role?.Name, email = user.Email }),
                    CreatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }
            catch { /* Không để lỗi log ảnh hưởng login */ }

            return Ok(new
            {
                Token    = tokenString,
                Role     = user.Role?.Name,
                UserId   = user.Id,
                FullName = user.FullName,
                Email    = user.Email,
                Message  = "Đăng nhập thành công"
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var email = request.Email.Trim();
            if (await _context.Users.AnyAsync(user => user.Email == email))
            {
                return Conflict(new { Message = "Email này đã được sử dụng." });
            }

            var guestRole = await _context.Roles
                .FirstOrDefaultAsync(role => role.Name == "Guest");
            if (guestRole == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Message = "Vai trò khách hàng chưa được cấu hình." });
            }

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Phone = request.Phone.Trim(),
                Email = email,
                PasswordHash = PasswordHelper.Hash(request.Password),
                RoleId = guestRole.Id,
                Status = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
            {
                return Conflict(new { Message = "Email này đã được sử dụng." });
            }

            return Ok(new { Message = "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục." });
        }
    }
}