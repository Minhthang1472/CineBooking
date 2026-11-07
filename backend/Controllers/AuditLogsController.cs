using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuditLogsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        // Chỉ ghi nhận các hành động QUAN TRỌNG — bỏ qua GET, SYNC, CLONE
        private static readonly HashSet<string> IMPORTANT_ACTIONS = new(StringComparer.OrdinalIgnoreCase)
        {
            "CREATE", "UPDATE", "DELETE", "UPDATE_STATUS", "UPLOAD_IMAGE",
            "LOGIN", "LOGOUT", "BULK_CREATE", "REPORT_USAGE"
        };

        // Chỉ ghi nhận các bảng QUAN TRỌNG — bỏ qua các bảng log/phụ
        private static readonly HashSet<string> IMPORTANT_TABLES = new(StringComparer.OrdinalIgnoreCase)
        {
            "Booking", "Invoice", "Payment", "User", "LossAndDamage",
            "Room", "LoaiPhong", "Article", "Attraction", "Voucher",
            "OrderService", "Membership"
        };

        public AuditLogsController(HotelDbContext context) { _context = context; }

        // GET: api/AuditLogs
        [HttpGet]
        public async Task<ActionResult<object>> GetAuditLogs(
            [FromQuery] int limit = 100,
            [FromQuery] string? action = null,
            [FromQuery] string? table = null)
        {
            // 1. Tự động dọn dẹp log cũ hơn 7 ngày
            await PurgeOldLogs();

            // 2. Query với filter
            var query = _context.AuditLogs
                .Include(a => a.User)
                    .ThenInclude(u => u!.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action.ToUpper());
            if (!string.IsNullOrEmpty(table))
                query = query.Where(a => a.TableName == table);

            // 3. Chỉ lấy hành động quan trọng
            var logs = await query
                .Where(a => IMPORTANT_ACTIONS.Contains(a.Action))
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .ToListAsync();

            // 4. Map sang format chuẩn mẫu thầy
            var events = logs.Select(a => {
                object? oldData = null;
                object? newData = null;
                try { if (!string.IsNullOrEmpty(a.OldValue)) oldData = JsonSerializer.Deserialize<object>(a.OldValue); } catch { }
                try { if (!string.IsNullOrEmpty(a.NewValue)) newData = JsonSerializer.Deserialize<object>(a.NewValue); } catch { }

                var userName = a.User?.FullName ?? "Hệ thống";
                var roleName = a.User?.Role?.Name ?? "";
                var actor = string.IsNullOrEmpty(roleName) ? userName : $"{userName} ({roleName})";

                var actionVN = a.Action?.ToUpper() switch
                {
                    "CREATE"        => "Tạo mới",
                    "UPDATE"        => "Cập nhật",
                    "UPDATE_STATUS" => "Đổi trạng thái",
                    "UPLOAD_IMAGE"  => "Upload ảnh",
                    "BULK_CREATE"   => "Tạo hàng loạt",
                    "DELETE"        => "Xóa",
                    "LOGIN"         => "Đăng nhập",
                    "LOGOUT"        => "Đăng xuất",
                    "REPORT_USAGE"  => "Báo cáo sử dụng",
                    _               => a.Action
                };

                return new
                {
                    eventId    = Guid.NewGuid().ToString(), // unique per response
                    timestamp  = a.CreatedAt ?? DateTime.Now,
                    actionType = a.Action?.ToUpper(),
                    entityType = a.TableName,
                    context    = new
                    {
                        recordId   = a.RecordId,
                        actor      = actor,
                        actorId    = a.UserId,
                    },
                    changes = new { oldData, newData },
                    message = $"{actionVN} {a.TableName} (#{a.RecordId}) bởi {actor}"
                };
            }).ToList();

            // Thống kê theo loại action
            var stats = logs
                .GroupBy(a => a.Action?.ToUpper())
                .ToDictionary(g => g.Key ?? "UNKNOWN", g => g.Count());

            return Ok(new
            {
                TotalEvents = events.Count,
                Stats       = stats,
                RetentionDays = 7,
                Events      = events
            });
        }

        // POST: api/AuditLogs — Ghi log từ controller khác (nội bộ)
        [HttpPost]
        public async Task<IActionResult> CreateLog([FromBody] CreateAuditLogRequest req)
        {
            // Chỉ lưu nếu là hành động quan trọng
            if (!IMPORTANT_ACTIONS.Contains(req.Action?.ToUpper() ?? ""))
                return Ok(new { Skipped = true, Reason = "Hành động không cần ghi log" });

            var log = new AuditLog
            {
                UserId    = req.UserId,
                Action    = req.Action.ToUpper(),
                TableName = req.TableName,
                RecordId  = req.RecordId,
                OldValue  = req.OldValue,
                NewValue  = req.NewValue,
                CreatedAt = DateTime.Now,
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã ghi log", Id = log.Id });
        }

        // DELETE: api/AuditLogs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLog(int id)
        {
            var log = await _context.AuditLogs.FindAsync(id);
            if (log == null) return NotFound(new { Message = "Không tìm thấy nhật ký." });
            _context.AuditLogs.Remove(log);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã xóa nhật ký." });
        }

        // DELETE: api/AuditLogs/purge — Xóa tất cả log cũ (admin dùng thủ công)
        [HttpDelete("purge")]
        public async Task<IActionResult> PurgeAll()
        {
            var cutoff = DateTime.Now.AddDays(-7);
            var old = await _context.AuditLogs
                .Where(a => a.CreatedAt < cutoff)
                .ToListAsync();
            _context.AuditLogs.RemoveRange(old);
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Đã xóa {old.Count} bản ghi cũ hơn 7 ngày.", Deleted = old.Count });
        }

        // DELETE: api/AuditLogs/purge-all — Xóa TOÀN BỘ log (reset)
        [HttpDelete("purge-all")]
        public async Task<IActionResult> PurgeAllNow()
        {
            var all = await _context.AuditLogs.ToListAsync();
            _context.AuditLogs.RemoveRange(all);
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Đã xóa toàn bộ {all.Count} bản ghi audit log.", Deleted = all.Count });
        }

        // Private: Tự động dọn dẹp log > 7 ngày mỗi khi GET
        private async Task PurgeOldLogs()
        {
            var cutoff = DateTime.Now.AddDays(-7);
            var old = await _context.AuditLogs
                .Where(a => a.CreatedAt != null && a.CreatedAt < cutoff)
                .ToListAsync();
            if (old.Any())
            {
                _context.AuditLogs.RemoveRange(old);
                await _context.SaveChangesAsync();
            }
        }
    }

    public class CreateAuditLogRequest
    {
        public int? UserId { get; set; }
        public string Action { get; set; } = null!;
        public string TableName { get; set; } = null!;
        public int RecordId { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }
}
