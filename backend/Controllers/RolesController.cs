using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bảo mật bằng Token
    public class RolesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public RolesController(HotelDbContext context)
        {
            _context = context;
        }

        // ====================================================
        // 1. LẤY DANH SÁCH TẤT CẢ VAI TRÒ (ĐOẠN BẠN BỊ THIẾU NÈ)
        // ====================================================
        [HttpGet]
        public async Task<IActionResult> GetAllRoles()
        {
            try
            {
                var roles = await _context.Roles
                    .Select(r => new {
                        id = r.Id,
                        name = r.Name,
                        description = r.Description // Chú ý: Nếu bảng Roles trong CSDL của bạn không có cột Description, hãy xóa dòng này đi nhé!
                    })
                    .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                return BadRequest("Lỗi khi lấy danh sách Vai trò: " + ex.Message);
            }
        }

        // ====================================================
        // 2. CẤP QUYỀN CHO VAI TRÒ
        // ====================================================
        [HttpPost("assign-permission")]
        public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionToRoleRequest request)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions) 
                .FirstOrDefaultAsync(r => r.Id == request.RoleId);

            if (role == null) return NotFound(new { Message = "Chức vụ (Role) không tồn tại." });

            var permission = await _context.Permissions.FindAsync(request.PermissionId);
            if (permission == null) return NotFound(new { Message = "Quyền (Permission) không tồn tại." });

            if (role.Permissions.Any(p => p.Id == request.PermissionId))
            {
                return BadRequest(new { Message = "Quyền này đã được cấp cho chức vụ này từ trước rồi." });
            }

            role.Permissions.Add(permission);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cấp quyền thành công!" });
        }

        // ====================================================
        // 3. LẤY DANH SÁCH QUYỀN CỦA TÀI KHOẢN ĐANG ĐĂNG NHẬP
        // ====================================================
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { Message = "Không xác định được người dùng." });
            }

            var user = await _context.Users
                .Include(u => u.Role)
                    .ThenInclude(r => r.Permissions) 
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Role == null)
            {
                return Ok(new { Message = "Bạn chưa được phân quyền.", Permissions = new string[] { } });
            }

            var myPermissions = user.Role.Permissions.Select(p => p.Name).ToList();

            return Ok(new 
            { 
                RoleId = user.RoleId,
                RoleName = user.Role.Name,
                TotalPermissions = myPermissions.Count,
                Permissions = myPermissions 
            });
        }
    } // Đóng class RolesController

    // ====================================================
    // CÁC CLASS PHỤ TRỢ NẰM NGOÀI CONTROLLER
    // ====================================================
    public class AssignPermissionToRoleRequest
    {
        public int RoleId { get; set; }
        public int PermissionId { get; set; }
    }
} // Đóng namespace