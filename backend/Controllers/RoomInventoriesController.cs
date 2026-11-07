using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomInventoriesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public RoomInventoriesController(HotelDbContext context)
        {
            _context = context;
        }

        [HttpGet("room/{roomId}")]
        public async Task<ActionResult<IEnumerable<RoomInventory>>> GetInventoryByRoom(int roomId)
        {
            try
            {
                var inventories = await _context.RoomInventories
                    .Where(ri => ri.RoomId == roomId)
                    .Include(ri => ri.Equipment)
                    .Select(ri => new {
                        id = ri.Id,
                        roomId = ri.RoomId,
                        equipmentId = ri.EquipmentId,
                        itemName = ri.Equipment != null ? ri.Equipment.Name : "Unknown Equipment",
                        quantity = ri.Quantity,
                        priceIfLost = ri.PriceIfLost,
                        note = ri.Note
                    })
                    .OrderBy(ri => ri.id)
                    .ToListAsync();

                return Ok(new { data = inventories });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Lỗi: " + ex.Message });
            }
        }

        // Thêm một đồ dùng mới vào phòng
        // POST: api/RoomInventories
        [HttpPost]
        public async Task<ActionResult<RoomInventory>> CreateRoomInventory(RoomInventory roomInventory)
        {
            _context.RoomInventories.Add(roomInventory);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Thêm đồ dùng thành công!", Data = roomInventory });
        }

        // Cập nhật thông tin đồ dùng (số lượng, giá đền bù...)
        // PUT: api/RoomInventories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomInventory(int id, RoomInventory roomInventory)
        {
            if (id != roomInventory.Id)
            {
                return BadRequest(new { Message = "ID không khớp." });
            }

            _context.Entry(roomInventory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomInventoryExists(id))
                    return NotFound();
                else
                    throw;
            }

            return Ok(new { Message = "Cập nhật thành công!" });
        }

        // Xóa đồ dùng
        // DELETE: api/RoomInventories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomInventory(int id)
        {
            var roomInventory = await _context.RoomInventories.FindAsync(id);
            if (roomInventory == null)
            {
                return NotFound();
            }

            _context.RoomInventories.Remove(roomInventory);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa đồ dùng khỏi phòng." });
        }

        // ✅ TÍNH NĂNG ĐẶC BIỆT: Clone dữ liệu từ phòng này sang phòng khác
        // POST: api/RoomInventories/clone
        [HttpPost("clone")]
        public async Task<IActionResult> CloneInventory([FromBody] CloneInventoryRequest request)
        {
            try
            {
                // Kiểm tra phòng đích tồn tại
                var targetRoom = await _context.Rooms.FindAsync(request.TargetRoomId);
                if (targetRoom == null)
                    return NotFound(new { Message = $"Phòng {request.TargetRoomId} không tồn tại." });

                // 1. Lấy toàn bộ đồ dùng của phòng gốc
                var sourceItems = await _context.RoomInventories
                    .Where(ri => ri.RoomId == request.SourceRoomId)
                    .AsNoTracking()
                    .ToListAsync();

                if (!sourceItems.Any())
                    return BadRequest(new { Message = "Phòng gốc không có đồ dùng để sao chép." });

                // 2. Xóa đồ dùng cũ của phòng đích
                var existingTargetItems = await _context.RoomInventories
                    .Where(ri => ri.RoomId == request.TargetRoomId)
                    .ToListAsync();
                _context.RoomInventories.RemoveRange(existingTargetItems);

                // 3. Tạo danh sách mới cho phòng đích (GIỮ LẠI EQUIPMENTID)
                var newItems = sourceItems.Select(item => new RoomInventory
                {
                    RoomId = request.TargetRoomId,
                    EquipmentId = item.EquipmentId,  // ✅ QUAN TRỌNG
                    ItemType = item.ItemType,
                    Quantity = item.Quantity,
                    PriceIfLost = item.PriceIfLost,
                    Note = item.Note,
                    IsActive = item.IsActive
                }).ToList();

                _context.RoomInventories.AddRange(newItems);
                await _context.SaveChangesAsync();

                return Ok(new {
                    Message = $"Đã sao chép {newItems.Count} thiết bị sang phòng {request.TargetRoomId}.",
                    Count = newItems.Count,
                    Success = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    Message = "Lỗi khi sao chép: " + ex.Message,
                    Success = false
                });
            }
        }

        // ✅ API Đồng bộ từ kho (lấy tất cả equipment từ bảng Equipments)
        // POST: api/RoomInventories/sync-from-warehouse
        [HttpPost("sync-from-warehouse")]
        public async Task<IActionResult> SyncFromWarehouse([FromBody] SyncFromWarehouseRequest request)
        {
            try
            {
                // Kiểm tra phòng tồn tại
                var room = await _context.Rooms.FindAsync(request.RoomId);
                if (room == null)
                    return NotFound(new { Message = $"Phòng {request.RoomId} không tồn tại." });

                // 1. Lấy tất cả equipment từ kho
                var equipments = await _context.Equipments
                    .Where(e => e.IsActive)
                    .AsNoTracking()
                    .ToListAsync();

                if (!equipments.Any())
                    return BadRequest(new { Message = "Không có thiết bị nào trong kho." });

                // 2. Xóa dữ liệu cũ của phòng
                var existingItems = await _context.RoomInventories
                    .Where(ri => ri.RoomId == request.RoomId)
                    .ToListAsync();
                _context.RoomInventories.RemoveRange(existingItems);

                // 3. Thêm tất cả equipment từ kho
                var newItems = equipments.Select(eq => new RoomInventory
                {
                    RoomId = request.RoomId,
                    EquipmentId = eq.Id,
                    Quantity = 1,
                    PriceIfLost = eq.DefaultPriceIfLost,
                    Note = "Đồng bộ từ kho",
                    IsActive = true,
                    ItemType = "Asset"
                }).ToList();

                _context.RoomInventories.AddRange(newItems);
                await _context.SaveChangesAsync();

                return Ok(new {
                    Message = $"Đã đồng bộ {newItems.Count} thiết bị từ kho cho phòng {request.RoomId}.",
                    Count = newItems.Count,
                    Success = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    Message = "Lỗi khi đồng bộ: " + ex.Message,
                    Success = false
                });
            }
        }

        private bool RoomInventoryExists(int id)
        {
            return _context.RoomInventories.Any(e => e.Id == id);
        }
    }

    // ✅ Class phụ trợ để nhận dữ liệu JSON cho API Clone
    public class CloneInventoryRequest
    {
        public int SourceRoomId { get; set; }
        public int TargetRoomId { get; set; }
    }

    // ✅ Class phụ trợ để nhận dữ liệu JSON cho API Sync từ Kho
    public class SyncFromWarehouseRequest
    {
        public int RoomId { get; set; }
    }
}