using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using System.Text.Json;

namespace HotelManagementApi.Filters
{
    /// <summary>
    /// Tự động ghi nhật ký cho mọi hành động tạo mới / cập nhật / xóa
    /// trên toàn bộ hệ thống mà không cần sửa từng controller.
    /// </summary>
    public class AuditLogFilter : IAsyncActionFilter
    {
        private readonly HotelDbContext _context;

        public AuditLogFilter(HotelDbContext context)
        {
            _context = context;
        }

        // Bảng ánh xạ: tên controller -> tên bảng dữ liệu thân thiện
        private static readonly Dictionary<string, string> TABLE_MAP = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Attractions",        "Địa Điểm"           },
            { "Bookings",           "Đặt Phòng"          },
            { "Rooms",              "Phòng"              },
            { "RoomTypes",          "Loại Phòng"         },
            { "RoomInventories",    "Kho Vật Tư"         },
            { "Users",              "Người Dùng"         },
            { "UserManagement",     "Người Dùng"         },
            { "Roles",              "Vai Trò"            },
            { "Permissions",        "Quyền Hạn"          },
            { "Invoices",           "Hóa Đơn"            },
            { "Payments",           "Thanh Toán"         },
            { "OrderServices",      "Dịch Vụ Đặt"        },
            { "Equipments",         "Thiết Bị"           },
            { "LossAndDamages",     "Tổn Thất"           },
            { "Services",           "Dịch Vụ"            },
            { "ServiceCategories",  "Danh Mục DV"        },
            { "Articles",           "Bài Viết"           },
            { "ArticleCategories",  "Danh Mục BV"        },
            { "Vouchers",           "Voucher"            },
            { "Reviews",            "Đánh Giá"           },
            { "Memberships",        "Hạng Thành Viên"    },
            { "Amenities",          "Tiện Nghi"          },
            { "Momo",               "Thanh Toán MoMo"    },
        };

        // Chỉ log các HTTP Method thay đổi dữ liệu
        private static readonly HashSet<string> LOGGED_METHODS = new(StringComparer.OrdinalIgnoreCase)
        {
            "POST", "PUT", "PATCH", "DELETE"
        };

        // Các controller không cần log
        private static readonly HashSet<string> SKIP_CONTROLLERS = new(StringComparer.OrdinalIgnoreCase)
        {
            "AuditLogs", "Auth", "Notifications", "Dashboard",
            "DashboardPeriods", "RoleDashboardPeriodStates"
        };

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var method = context.HttpContext.Request.Method;

            // Chỉ xử lý request thay đổi dữ liệu
            if (!LOGGED_METHODS.Contains(method))
            {
                await next();
                return;
            }

            // Xác định tên controller
            var controllerName = context.RouteData.Values["controller"]?.ToString() ?? "Unknown";

            // Bỏ qua các controller không cần thiết
            if (SKIP_CONTROLLERS.Contains(controllerName))
            {
                await next();
                return;
            }

            // Lấy thông tin user từ JWT token
            int? userId = null;
            var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out int parsedId)) userId = parsedId;

            // Lấy tên bảng
            var tableName = TABLE_MAP.TryGetValue(controllerName, out var mapped) ? mapped : controllerName;

            // Xác định hành động
            var actionType = method.ToUpper() switch
            {
                "POST"   => "CREATE",
                "PUT"    => "UPDATE",
                "PATCH"  => "UPDATE",
                "DELETE" => "DELETE",
                _        => method.ToUpper()
            };

            // Lấy record ID từ route (nếu có)
            int recordId = 0;
            if (context.RouteData.Values.TryGetValue("id", out var idVal) && idVal != null)
                int.TryParse(idVal.ToString(), out recordId);

            // Lấy dữ liệu body (request body) - serialize để lưu
            string? requestBodyJson = null;
            string? actionLabel = null;
            try
            {
                // Tóm tắt action theo route
                var actionName = context.RouteData.Values["action"]?.ToString() ?? "";
                actionLabel = actionName switch
                {
                    var a when a.Contains("Status", StringComparison.OrdinalIgnoreCase) => "UPDATE_STATUS",
                    var a when a.Contains("Thumbnail", StringComparison.OrdinalIgnoreCase) => "UPLOAD_IMAGE",
                    var a when a.Contains("Upload", StringComparison.OrdinalIgnoreCase) => "UPLOAD_IMAGE",
                    var a when a.Contains("Bulk", StringComparison.OrdinalIgnoreCase) => "BULK_CREATE",
                    _ => actionType
                };

                var bodyArg = context.ActionArguments.Values
                    .FirstOrDefault(v => v != null && !(v is int) && !(v is string) && !(v is IFormFile) && !(v is IFormFileCollection));
                if (bodyArg != null)
                {
                    var opts = new JsonSerializerOptions
                    {
                        WriteIndented = false,
                        MaxDepth = 3 // Tránh serialize quá sâu
                    };
                    requestBodyJson = JsonSerializer.Serialize(bodyArg, opts);
                    // Giới hạn độ dài để tránh log quá lớn
                    if (requestBodyJson?.Length > 2000)
                        requestBodyJson = requestBodyJson[..2000] + "...[truncated]";
                }
            }
            catch { /* Bỏ qua nếu không serialize được */ }

            // Thực thi action
            var executedContext = await next();

            // Kiểm tra kết quả có thành công không
            bool isSuccess = false;
            int newRecordId = recordId;

            if (executedContext.Result is ObjectResult objResult)
            {
                isSuccess = objResult.StatusCode is null or >= 200 and < 300;

                // Nếu là CREATE, lấy ID của record mới tạo từ response
                if (isSuccess && actionType == "CREATE" && newRecordId == 0)
                {
                    try
                    {
                        var resultJson = JsonSerializer.Serialize(objResult.Value,
                            new JsonSerializerOptions { MaxDepth = 5 });
                        using var doc = JsonDocument.Parse(resultJson);
                        var root = doc.RootElement;

                        // Thử nhiều pattern để lấy ID
                        if (root.TryGetProperty("id", out var idEl)) newRecordId = idEl.GetInt32();
                        else if (root.TryGetProperty("Id", out var idEl2)) newRecordId = idEl2.GetInt32();
                        else if (root.TryGetProperty("data", out var dataEl))
                        {
                            if (dataEl.TryGetProperty("id", out var dId)) newRecordId = dId.GetInt32();
                            else if (dataEl.TryGetProperty("Id", out var dId2)) newRecordId = dId2.GetInt32();
                        }
                        else if (root.TryGetProperty("Data", out var dataEl2))
                        {
                            if (dataEl2.TryGetProperty("id", out var dId)) newRecordId = dId.GetInt32();
                        }
                    }
                    catch { }
                }
            }
            else if (executedContext.Result is CreatedAtActionResult createdResult)
            {
                // CreatedAtActionResult = 201 Created - luôn thành công
                isSuccess = true;
                if (newRecordId == 0 && createdResult.RouteValues != null)
                {
                    if (createdResult.RouteValues.TryGetValue("id", out var routeId))
                        int.TryParse(routeId?.ToString(), out newRecordId);
                }
                if (newRecordId == 0 && createdResult.Value != null)
                {
                    try
                    {
                        var json = JsonSerializer.Serialize(createdResult.Value, new JsonSerializerOptions { MaxDepth = 3 });
                        using var doc = JsonDocument.Parse(json);
                        var root = doc.RootElement;
                        if (root.TryGetProperty("id", out var idEl)) newRecordId = idEl.GetInt32();
                        else if (root.TryGetProperty("Id", out var idEl2)) newRecordId = idEl2.GetInt32();
                    }
                    catch { }
                }
            }
            else if (executedContext.Result is NoContentResult)
            {
                // 204 NoContent - DELETE thành công
                isSuccess = true;
            }
            else if (executedContext.Result is StatusCodeResult scr)
            {
                isSuccess = scr.StatusCode is >= 200 and < 300;
            }
            else if (executedContext.Result == null && executedContext.Exception == null)
            {
                // Không có exception, không có result cụ thể -> coi là thành công
                isSuccess = true;
            }

            // Chỉ ghi log nếu action thành công
            if (!isSuccess) return;

            // Tạo thông điệp mô tả
            var finalAction = actionLabel ?? actionType;

            // Ghi nhật ký vào CSDL
            try
            {
                var log = new AuditLog
                {
                    UserId    = userId,
                    Action    = finalAction,
                    TableName = tableName,
                    RecordId  = newRecordId,
                    NewValue  = (finalAction != "DELETE") ? requestBodyJson : null,
                    OldValue  = null,
                    CreatedAt = DateTime.Now
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Không để lỗi log ảnh hưởng đến luồng chính
                Console.WriteLine($"[AuditLogFilter] Lỗi ghi log: {ex.Message}");
            }
        }
    }
}
