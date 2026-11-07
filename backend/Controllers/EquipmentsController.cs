using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] 
    public class EquipmentsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public EquipmentsController(HotelDbContext context)
        {
            _context = context;
        }

        // ====================================================
        // 1. LẤY DANH SÁCH VẬT TƯ (CÓ PHÂN TRANG VÀ TÌM KIẾM)
        // ====================================================
        [HttpGet]
public async Task<IActionResult> GetEquipments(
    [FromQuery] string? search = null, 
    [FromQuery] string? category = null, 
    [FromQuery] int? page = 1, 
    [FromQuery] int? pageSize = 10)
{
    try
    {
        int validPage = (page == null || page < 1) ? 1 : page.Value;
        int validPageSize = (pageSize == null || pageSize < 1) ? 10 : pageSize.Value;

        var query = _context.Equipments.AsQueryable();

        // Lọc theo từ khóa tìm kiếm (Mã hoặc Tên)
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(e => e.ItemCode.ToLower().Contains(s) || e.Name.ToLower().Contains(s));
        }

        // Lọc theo danh mục
        if (!string.IsNullOrWhiteSpace(category) && category != "Tất cả")
        {
            query = query.Where(e => e.Category == category);
        }

        // Sắp xếp mặc định: Mới nhất lên đầu
        query = query.OrderByDescending(e => e.Id);

        // Tổng số record để phân trang
        var totalCount = await query.CountAsync();

        // Load dữ liệu từ DB trước
        var equipmentList = await query
            .Skip((validPage - 1) * validPageSize)
            .Take(validPageSize)
            .ToListAsync();

        // Tính InStockQuantity trong C# thay vì dùng cột COMPUTED
        var result = equipmentList.Select(e => new {
            id = e.Id,
            itemCode = e.ItemCode ?? "N/A",
            name = e.Name ?? "N/A",
            category = e.Category ?? "N/A",
            unit = e.Unit ?? "N/A",
            totalQuantity = e.TotalQuantity,
            inUseQuantity = e.InUseQuantity,
            damagedQuantity = e.DamagedQuantity,
            liquidatedQuantity = e.LiquidatedQuantity,
            inStockQuantity = e.TotalQuantity - e.InUseQuantity - e.DamagedQuantity - e.LiquidatedQuantity,
            basePrice = e.BasePrice,
            defaultPriceIfLost = e.DefaultPriceIfLost,
            supplier = e.Supplier ?? "N/A",
            isActive = e.IsActive,
            imageUrl = e.ImageUrl
        }).ToList();

        return Ok(new
        {
            data = result,
            totalCount = totalCount,
            page = validPage,
            pageSize = validPageSize
        });
    }
    catch (Exception ex)
    {
        // In chi tiết lỗi ra Debug Console để bạn biết exact line nào fail
        System.Diagnostics.Debug.WriteLine("=== LỖI CHI TIẾT ===");
        System.Diagnostics.Debug.WriteLine($"Message: {ex.Message}");
        System.Diagnostics.Debug.WriteLine($"StackTrace: {ex.StackTrace}");
        System.Diagnostics.Debug.WriteLine($"InnerException: {ex.InnerException?.Message}");
        
        return BadRequest(new { 
            Message = "Lỗi khi lấy danh sách Vật tư: " + ex.Message,
            StackTrace = ex.StackTrace,
            InnerException = ex.InnerException?.Message
        });
    }
}

        // ====================================================
        // 2. LẤY THÔNG TIN CHI TIẾT 1 VẬT TƯ
        // ====================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEquipmentById(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);

            if (equipment == null)
            {
                return NotFound(new { Message = "Vật tư không tồn tại." });
            }

            return Ok(new {
                id = equipment.Id,
                itemCode = equipment.ItemCode,
                name = equipment.Name,
                category = equipment.Category,
                unit = equipment.Unit,
                totalQuantity = equipment.TotalQuantity,
                inStockQuantity = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity,
                basePrice = equipment.BasePrice,
                defaultPriceIfLost = equipment.DefaultPriceIfLost,
                supplier = equipment.Supplier,
                isActive = equipment.IsActive,
                imageUrl = equipment.ImageUrl
            });
        }

        // ====================================================
        // 3. THÊM VẬT TƯ MỚI
        // ====================================================
        [HttpPost]
        public async Task<IActionResult> CreateEquipment([FromBody] EquipmentRequest request)
        {
            try
            {
                // Kiểm tra mã vật tư đã tồn tại chưa
                var isExist = await _context.Equipments.AnyAsync(e => e.ItemCode == request.ItemCode);
                if (isExist)
                {
                    return BadRequest(new { Message = "Mã vật tư này đã tồn tại!" });
                }

                var equipment = new Equipment
                {
                    ItemCode = request.ItemCode,
                    Name = request.Name,
                    Category = request.Category,
                    Unit = request.Unit,
                    TotalQuantity = request.TotalQuantity,
                    InUseQuantity = 0,      // ✅ FIX: Khởi tạo các giá trị liên quan đến tính toán
                    DamagedQuantity = 0,
                    LiquidatedQuantity = 0,
                    BasePrice = request.BasePrice,
                    DefaultPriceIfLost = request.DefaultPriceIfLost,
                    Supplier = request.Supplier,
                    ImageUrl = request.ImageUrl,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Equipments.Add(equipment);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Thêm vật tư thành công!", Data = equipment });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Lỗi khi thêm vật tư: " + ex.Message });
            }
        }

        // ====================================================
        // 4. CẬP NHẬT VẬT TƯ
        // ====================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEquipment(int id, [FromBody] EquipmentRequest request)
        {
            try
            {
                var equipment = await _context.Equipments.FindAsync(id);

                if (equipment == null)
                {
                    return NotFound(new { Message = "Vật tư không tồn tại." });
                }

                // Cập nhật thông tin
                equipment.Name = request.Name;
                equipment.Category = request.Category;
                equipment.Unit = request.Unit;
                equipment.TotalQuantity = request.TotalQuantity;
                equipment.BasePrice = request.BasePrice;
                equipment.DefaultPriceIfLost = request.DefaultPriceIfLost;
                equipment.Supplier = request.Supplier;
                
                if (!string.IsNullOrEmpty(request.ImageUrl))
                {
                    equipment.ImageUrl = request.ImageUrl;
                }

                equipment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Cập nhật vật tư thành công!", Data = equipment });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Lỗi khi cập nhật vật tư: " + ex.Message });
            }
        }

        // ====================================================
        // 5. CHUYỂN TRẠNG THÁI BẬT/TẮT VẬT TƯ
        // ====================================================
        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleEquipmentStatus(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return NotFound(new { Message = "Vật tư không tồn tại." });

            equipment.IsActive = !equipment.IsActive; 
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật trạng thái thành công!", IsActive = equipment.IsActive });
        }
    }

    public class EquipmentRequest
    {
        public string ItemCode { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public string Unit { get; set; }
        public int TotalQuantity { get; set; }
        public decimal BasePrice { get; set; }
        public decimal DefaultPriceIfLost { get; set; }
        public string Supplier { get; set; }
        public string? ImageUrl { get; set; }
    }
}