using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LossAndDamagesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public LossAndDamagesController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/LossAndDamages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LossAndDamageDto>>> GetLossAndDamages()
        {
            var results = await _context.LossAndDamages
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri.Room)
                .Select(ld => new LossAndDamageDto
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    RoomInventoryId = ld.RoomInventoryId,
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    Description = ld.Description,
                    CreatedAt = ld.CreatedAt ?? DateTime.Now,
                    ItemType = ld.RoomInventory != null ? ld.RoomInventory.ItemType : "N/A",
                    RoomNumber = (ld.RoomInventory != null && ld.RoomInventory.Room != null) 
                                 ? ld.RoomInventory.Room.RoomNumber : "N/A"
                })
                .ToListAsync();

            return Ok(results);
        }

        // GET: api/LossAndDamages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LossAndDamage>> GetLossAndDamage(int id)
        {
            var lossAndDamage = await _context.LossAndDamages.FindAsync(id);
            if (lossAndDamage == null) return NotFound(new { Message = "KhÃ´ng tÃ¬m tháº¥y báº£n ghi Ä‘á»n bÃ¹" });
            return Ok(lossAndDamage);
        }

        // POST: api/LossAndDamages
        [HttpPost]
        public async Task<ActionResult<LossAndDamage>> PostLossAndDamage([FromBody] LossAndDamage lossAndDamage)
        {
            if (lossAndDamage == null) return BadRequest();
            
            if (lossAndDamage.CreatedAt == null)
                lossAndDamage.CreatedAt = DateTime.Now;

            _context.LossAndDamages.Add(lossAndDamage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLossAndDamage), new { id = lossAndDamage.Id }, lossAndDamage);
        }

        // PUT: api/LossAndDamages/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLossAndDamage(int id, [FromBody] LossAndDamage lossAndDamage)
        {
            if (id != lossAndDamage.Id) return BadRequest(new { Message = "ID khÃ´ng khá»›p" });

            _context.Entry(lossAndDamage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.LossAndDamages.Any(e => e.Id == id))
                    return NotFound(new { Message = "TÃ i liá»‡u Ä‘á»n bÃ¹ nÃ y Ä‘Ã£ bá»‹ xÃ³a hoáº·c khÃ´ng cÃ²n tá»“n táº¡i" });
                else throw;
            }

            return Ok(new { Message = "Cáº­p nháº­t thÃ nh cÃ´ng", Data = lossAndDamage });
        }

        // DELETE: api/LossAndDamages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLossAndDamage(int id)
        {
            var lossAndDamage = await _context.LossAndDamages.FindAsync(id);
            if (lossAndDamage == null) return NotFound();

            _context.LossAndDamages.Remove(lossAndDamage);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Da xoa ban ghi den bu thanh cong" });
        }

        // POST: api/LossAndDamages/report-usage
        // Khach/Le tan bao cao vat tu tieu thu trong phong (VD: uong Coca, mat khan...)
        [HttpPost("report-usage")]
        public async Task<IActionResult> ReportUsage([FromBody] ReportUsageRequest req)
        {
            // Kiem tra inventory item ton tai
            var inventoryItem = await _context.RoomInventories
                .Include(ri => ri.Equipment)
                .Include(ri => ri.Room)
                .FirstOrDefaultAsync(ri => ri.Id == req.RoomInventoryId);

            if (inventoryItem == null)
                return NotFound(new { Message = "Khong tim thay vat tu nay." });

            // Kiem tra so luong du de bao cao
            if (req.Quantity <= 0)
                return BadRequest(new { Message = "So luong phai lon hon 0." });

            // Tinh tien phat / chi phi theo gia niem yet
            var unitPrice = inventoryItem.PriceIfLost ?? 0;
            var totalCost = unitPrice * req.Quantity;

            // Tao ban ghi LossAndDamage
            var record = new LossAndDamage
            {
                RoomInventoryId = req.RoomInventoryId,
                BookingDetailId = req.BookingDetailId,
                Quantity = req.Quantity,
                PenaltyAmount = totalCost,
                Description = req.Description ?? $"Su dung: {inventoryItem.Equipment?.Name ?? "Vat tu"} x{req.Quantity}",
                CreatedAt = DateTime.Now,
            };

            _context.LossAndDamages.Add(record);
            await _context.SaveChangesAsync();

            return Ok(new {
                Message = "Bao cao su dung vat tu thanh cong!",
                Data = new {
                    id = record.Id,
                    itemName = inventoryItem.Equipment?.Name ?? "Vat tu",
                    roomNumber = inventoryItem.Room?.RoomNumber ?? "N/A",
                    quantity = record.Quantity,
                    totalCost = record.PenaltyAmount,
                    createdAt = record.CreatedAt,
                }
            });
        }

        // GET: api/LossAndDamages/by-booking/{bookingDetailId}
        // Admin xem tat ca vat tu da su dung trong 1 booking detail cu the
        [HttpGet("by-booking/{bookingDetailId}")]
        public async Task<IActionResult> GetByBooking(int bookingDetailId)
        {
            var results = await _context.LossAndDamages
                .Where(ld => ld.BookingDetailId == bookingDetailId)
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri!.Equipment)
                .Select(ld => new {
                    id = ld.Id,
                    itemName = ld.RoomInventory != null && ld.RoomInventory.Equipment != null
                        ? ld.RoomInventory.Equipment.Name : "Vat tu",
                    quantity = ld.Quantity,
                    penaltyAmount = ld.PenaltyAmount,
                    description = ld.Description,
                    createdAt = ld.CreatedAt,
                })
                .OrderByDescending(ld => ld.createdAt)
                .ToListAsync();

            return Ok(new { data = results, total = results.Sum(r => r.penaltyAmount) });
        }

        // GET: api/LossAndDamages/by-room/{roomId}/recent
        // Lay bao cao vat tu gan day cho 1 phong (30 ngay gan nhat)
        [HttpGet("by-room/{roomId}/recent")]
        public async Task<IActionResult> GetRecentByRoom(int roomId)
        {
            var since = DateTime.Now.AddDays(-30);
            var results = await _context.LossAndDamages
                .Where(ld => ld.RoomInventory != null && ld.RoomInventory.RoomId == roomId && ld.CreatedAt >= since)
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri!.Equipment)
                .Select(ld => new {
                    id = ld.Id,
                    itemName = ld.RoomInventory != null && ld.RoomInventory.Equipment != null
                        ? ld.RoomInventory.Equipment.Name : "Vat tu",
                    quantity = ld.Quantity,
                    penaltyAmount = ld.PenaltyAmount,
                    description = ld.Description,
                    createdAt = ld.CreatedAt,
                })
                .OrderByDescending(ld => ld.createdAt)
                .ToListAsync();

            return Ok(new { data = results });
        }
    }
    public class ReportUsageRequest
    {
        public int RoomInventoryId { get; set; }
        public int Quantity { get; set; }
        public int? BookingDetailId { get; set; }
        public string? Description { get; set; }
    }


    public class LossAndDamageDto
    {
        public int Id { get; set; }
        public int? BookingDetailId { get; set; }
        public int? RoomInventoryId { get; set; }
        public int Quantity { get; set; }
        public decimal PenaltyAmount { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? ItemName { get; set; }
        public string? RoomNumber { get; set; }
         public string? ItemType { get; set; }
    }
}

