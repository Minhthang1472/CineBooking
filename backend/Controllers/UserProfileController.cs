using HotelManagementApi.Models;
using HotelManagementApi.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập
    public class UserProfileController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IWebHostEnvironment _env;

        public UserProfileController(HotelDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // Hàm phụ trợ: Lấy ID của người dùng từ Token
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.Parse(userIdClaim);
        }

        // GET: api/UserProfile/my-profile
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Membership)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            // Trả về thông tin nhưng ẩn PasswordHash đi cho bảo mật
            return Ok(new { 
                user.Id, user.FullName, user.Email, user.Phone, 
                Role = user.Role?.Name, 
                Membership = user.Membership?.TierName 
            });
        }

        // PUT: api/UserProfile/update-profile
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);
            
            user.FullName = request.FullName;
            user.Phone = request.Phone;
            
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã cập nhật hồ sơ cá nhân." });
        }

        // PUT: api/UserProfile/change-password
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return Unauthorized(new { Message = "Không tìm thấy tài khoản." });

            if (!PasswordHelper.Verify(user, request.OldPassword))
                return BadRequest(new { Message = "Mật khẩu cũ không chính xác." });

            user.PasswordHash = PasswordHelper.Hash(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đổi mật khẩu thành công!" });
        }

        // POST: api/UserProfile/upload-avatar
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Vui lòng chọn ảnh hợp lệ.");

            // Lưu file vào wwwroot/avatars
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Directory.GetCurrentDirectory() + "/wwwroot", "avatars");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = "user_" + GetCurrentUserId() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var avatarUrl = "/avatars/" + uniqueFileName;
            
            /* Lưu ý nhỏ: Bảng Users trong DB SQL của bạn hiện tại CHƯA CÓ cột AvatarUrl. 
               Mình đã cấu hình lưu file thành công, nếu bạn muốn lưu vào DB thì 
               hãy Alter Table Users thêm cột AvatarUrl nhé. */

            return Ok(new { Message = "Upload Avatar thành công!", AvatarUrl = avatarUrl });
        }
    }

    // --- Các Class DTO nhận dữ liệu ---
    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string? OldPassword { get; set; }
        public string? NewPassword { get; set; }
    }
}
