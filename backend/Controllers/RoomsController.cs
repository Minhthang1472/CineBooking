// File: Controllers/RoomsController.cs
using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public RoomsController(HotelDbContext context)
        {
            _context = context;
        }

        [HttpGet]
public async Task<IActionResult> GetRooms()
{
    try
    {
        var rooms = await _context.Rooms
            .Include(r => r.RoomType)
            .OrderByDescending(r => r.Id)
            .Select(r => new {
                id = r.Id,
                roomNumber = r.RoomNumber,
                floor = r.Floor,
                status = r.Status,
                roomType = new {
                    id = r.RoomType.Id,
                    name = r.RoomType.Name,
                    basePrice = r.RoomType.BasePrice,
                    capacityAdults = r.RoomType.CapacityAdults,
                    capacityChildren = r.RoomType.CapacityChildren
                }
            })
            .ToListAsync();

        return Ok(new { data = rooms });
    }
    catch (Exception ex)
    {
        return BadRequest(new { Message = "Lỗi khi lấy danh sách phòng: " + ex.Message });
    }
}

        // POST: api/Rooms
        [HttpPost]
        public async Task<ActionResult<Room>> CreateRoom(Room room)
        {
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRooms), new { id = room.Id }, room);
        }


        // PATCH: api/Rooms/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] string newStatus)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound(new { Message = "Không tìm thấy phòng." });
            }

            room.Status = newStatus; // Chỉ cập nhật mỗi cái trạng thái
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật trạng thái thành công!" });
        }

        // GET: api/Rooms/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null)
            {
                return NotFound(new { Message = "Không tìm thấy phòng." });
            }

            return Ok(new { data = room });
        }

        // PUT: api/Rooms/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] Room roomUpdate)
        {
            if (id != roomUpdate.Id)
            {
                return BadRequest(new { Message = "ID phòng không khớp." });
            }

            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound(new { Message = "Không tìm thấy phòng." });
            }

            room.RoomNumber = roomUpdate.RoomNumber;
            room.Floor = roomUpdate.Floor;
            room.RoomTypeId = roomUpdate.RoomTypeId;
            room.Status = roomUpdate.Status;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RoomExists(id))
                {
                    return NotFound(new { Message = "Không tìm thấy phòng." });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { Message = "Cập nhật phòng thành công!", data = room });
        }

        // DELETE: api/Rooms/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound(new { Message = "Không tìm thấy phòng." });
            }

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa phòng thành công!" });
        }

        private bool RoomExists(int id)
        {
            return _context.Rooms.Any(e => e.Id == id);
        }
    
        // POST: api/Rooms/bulk-create
        [HttpPost("bulk-create")]
        public async Task<IActionResult> BulkCreateRooms([FromBody] List<Room> rooms)
        {
            if (rooms == null || !rooms.Any())
            {
                return BadRequest(new { Message = "Danh sách phòng trống. Vui lòng gửi mảng dữ liệu các phòng cần tạo." });
            }

            _context.Rooms.AddRange(rooms);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã thêm thành công {rooms.Count} phòng mới." });
        }
    }
}