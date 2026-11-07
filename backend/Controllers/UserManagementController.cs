
using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Yêu cầu có Token
    public class UserManagementController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public UserManagementController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/UserManagement
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            // Lấy danh sách user kèm theo tên Role và tên hạng Membership
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Membership)
                .ToListAsync();
        }

        // POST: api/UserManagement
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Tạo tài khoản thành công!", Data = user });
        }

        // PUT: api/UserManagement/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, User user)
        {
            if (id != user.Id) return BadRequest("ID không khớp.");
            
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật thông tin thành công!" });
        }

        // DELETE: api/UserManagement/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa tài khoản." });
        }

        // PUT: api/UserManagement/{id}/change-role
        [HttpPut("{id}/change-role")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] int newRoleId)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("Không tìm thấy user.");

            var roleExists = await _context.Roles.AnyAsync(r => r.Id == newRoleId);
            if (!roleExists) return BadRequest("Role không tồn tại trong hệ thống.");

            user.RoleId = newRoleId;
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã cấp lại quyền thành công cho user ID {id}!" });
        }
    }
}