using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermissionsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public PermissionsController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Permissions
        [HttpGet]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions.ToListAsync();
            return Ok(new { data = permissions });
        }

        // GET: api/Permissions/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPermission(int id)
        {
            var permission = await _context.Permissions.FindAsync(id);

            if (permission == null)
            {
                return NotFound(new { message = "Không tìm thấy quyền" });
            }

            return Ok(new { data = permission });
        }

        // POST: api/Permissions/assign-to-role
        [HttpPost("assign-to-role")]
        public async Task<IActionResult> AssignPermissionsToRole([FromBody] AssignPermissionRequest request)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == request.RoleId);

            if (role == null) return NotFound(new { message = "Không tìm thấy vai trò" });

            // Clear old permissions and add new ones
            role.Permissions.Clear();

            var newPermissions = await _context.Permissions
                .Where(p => request.PermissionIds.Contains(p.Id))
                .ToListAsync();

            foreach (var p in newPermissions)
            {
                role.Permissions.Add(p);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Gán quyền thành công" });
        }

        public class AssignPermissionRequest
        {
            public int RoleId { get; set; }
            public List<int> PermissionIds { get; set; } = new List<int>();
        }
    }
}
