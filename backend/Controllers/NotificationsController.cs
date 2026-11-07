using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public NotificationsController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.UserId,
                    n.Title,
                    n.Content,
                    n.Type,
                    n.ReferenceLink,
                    n.IsRead,
                    n.CreatedAt,
                    User = n.User != null ? new { n.User.Id, n.User.FullName, n.User.Email } : null
                })
                .ToListAsync();

            return Ok(new { data = notifications });
        }

        // GET: api/Notifications/user/5
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetNotificationsByUser(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(new { data = notifications });
        }

        // POST: api/Notifications
        [HttpPost]
        public async Task<IActionResult> CreateNotification(Notification notification)
        {
            notification.CreatedAt = DateTime.Now;
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gửi thông báo thành công", data = notification });
        }

        // PATCH: api/Notifications/5/read
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound(new { message = "Không tìm thấy thông báo" });

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }

        // PATCH: api/Notifications/read-all/user/5
        [HttpPatch("read-all/user/{userId}")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.IsRead == false)
                .ToListAsync();

            foreach (var n in notifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu tất cả là đã đọc" });
        }

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound(new { message = "Không tìm thấy thông báo" });

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa thông báo thành công" });
        }

        // DELETE: api/Notifications/delete-all
        [HttpDelete("delete-all")]
        public async Task<IActionResult> DeleteAllNotifications()
        {
            var all = _context.Notifications.ToList();
            if (all.Count == 0) return Ok(new { message = "Không có thông báo nào cần xóa" });

            _context.Notifications.RemoveRange(all);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa {all.Count} thông báo thành công" });
        }
    }
}
