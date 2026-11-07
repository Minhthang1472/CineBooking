using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HotelManagementApi.Models;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public BookingsController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Bookings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBookings()
        {
            var bookings = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Voucher)
                .Include(b => b.BookingDetails)
                    .ThenInclude(d => d.Room)
                        .ThenInclude(r => r.RoomType)
                .Include(b => b.BookingDetails)
                    .ThenInclude(d => d.RoomType)
                .OrderByDescending(b => b.Id)
                .ToListAsync();

            // Flatten để tránh circular reference
            var result = bookings.Select(b => new
            {
                b.Id,
                b.BookingCode,
                b.GuestName,
                b.GuestPhone,
                b.GuestEmail,
                b.Status,
                b.VoucherId,
                voucherCode = b.Voucher != null ? b.Voucher.Code : null,
                userId = b.UserId,
                userName = b.User != null ? b.User.FullName : null,
                bookingDetails = b.BookingDetails.Select(d => new
                {
                    d.Id,
                    d.BookingId,
                    d.RoomId,
                    d.RoomTypeId,
                    d.CheckInDate,
                    d.CheckOutDate,
                    d.PricePerNight,
                    roomNumber = d.Room != null ? d.Room.RoomNumber : null,
                    floor = d.Room != null ? d.Room.Floor : null,
                    roomTypeName = d.RoomType != null ? d.RoomType.Name : (d.Room != null && d.Room.RoomType != null ? d.Room.RoomType.Name : null),
                    capacityAdults = d.RoomType != null ? d.RoomType.CapacityAdults : (d.Room != null && d.Room.RoomType != null ? d.Room.RoomType.CapacityAdults : 0),
                    nights = (int)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays),
                    subtotal = d.PricePerNight * (decimal)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays)
                }).ToList()
            });

            return Ok(result);
        }

        // GET: api/Bookings/lookup?q=BK123 hoặc q=14 — Tìm booking theo code hoặc ID (cho admin tạo hóa đơn)
        [HttpGet("lookup")]
        public async Task<ActionResult<object>> LookupBooking([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Vui lòng nhập mã booking hoặc ID" });

            Booking? booking = null;

            // Thử parse thành ID trước
            if (int.TryParse(q.Trim(), out int bookingId))
            {
                booking = await _context.Bookings
                    .Include(b => b.BookingDetails).ThenInclude(d => d.Room).ThenInclude(r => r!.RoomType)
                    .Include(b => b.BookingDetails).ThenInclude(d => d.RoomType)
                    .FirstOrDefaultAsync(b => b.Id == bookingId);
            }

            // Nếu không tìm được bằng ID, tìm theo booking code
            if (booking == null)
            {
                booking = await _context.Bookings
                    .Include(b => b.BookingDetails).ThenInclude(d => d.Room).ThenInclude(r => r!.RoomType)
                    .Include(b => b.BookingDetails).ThenInclude(d => d.RoomType)
                    .FirstOrDefaultAsync(b => b.BookingCode == q.Trim());
            }

            if (booking == null)
                return NotFound(new { message = $"Không tìm thấy booking: {q}" });

            var result = new
            {
                booking.Id,
                booking.BookingCode,
                booking.GuestName,
                booking.GuestPhone,
                booking.GuestEmail,
                booking.Status,
                bookingDetails = booking.BookingDetails.Select(d => new {
                    d.Id, d.CheckInDate, d.CheckOutDate, d.PricePerNight,
                    roomTypeName = d.RoomType?.Name ?? d.Room?.RoomType?.Name,
                    nights = (int)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays),
                    subtotal = d.PricePerNight * (decimal)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays)
                }).ToList()
            };
            return Ok(result);
        }

        // GET: api/Bookings/user/5 — Lấy booking của một user cụ thể
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetBookingsByUser(int userId)

        {
            var bookings = await _context.Bookings
                .Include(b => b.User).Include(b => b.Voucher)
                .Include(b => b.BookingDetails).ThenInclude(d => d.Room).ThenInclude(r => r.RoomType)
                .Include(b => b.BookingDetails).ThenInclude(d => d.RoomType)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.Id).ToListAsync();

            var result = bookings.Select(b => new
            {
                b.Id, b.BookingCode, b.GuestName, b.GuestPhone, b.GuestEmail, b.Status, b.VoucherId,
                voucherCode = b.Voucher != null ? b.Voucher.Code : null,
                userId = b.UserId,
                userName = b.User != null ? b.User.FullName : null,
                bookingDetails = b.BookingDetails.Select(d => new
                {
                    d.Id, d.BookingId, d.RoomId, d.RoomTypeId, d.CheckInDate, d.CheckOutDate, d.PricePerNight,
                    roomNumber = d.Room != null ? d.Room.RoomNumber : null,
                    roomTypeName = d.RoomType != null ? d.RoomType.Name : (d.Room?.RoomType != null ? d.Room.RoomType.Name : null),
                    nights = (int)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays),
                    subtotal = d.PricePerNight * (decimal)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays)
                }).ToList()
            });
            return Ok(result);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetBooking(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Voucher)
                .Include(b => b.BookingDetails)
                    .ThenInclude(d => d.Room)
                        .ThenInclude(r => r.RoomType)
                .Include(b => b.BookingDetails)
                    .ThenInclude(d => d.RoomType)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null) return NotFound();

            var result = new
            {
                booking.Id,
                booking.BookingCode,
                booking.GuestName,
                booking.GuestPhone,
                booking.GuestEmail,
                booking.Status,
                booking.VoucherId,
                voucherCode = booking.Voucher != null ? booking.Voucher.Code : null,
                userId = booking.UserId,
                userName = booking.User != null ? booking.User.FullName : null,
                bookingDetails = booking.BookingDetails.Select(d => new
                {
                    d.Id,
                    d.BookingId,
                    d.RoomId,
                    d.RoomTypeId,
                    d.CheckInDate,
                    d.CheckOutDate,
                    d.PricePerNight,
                    roomNumber = d.Room != null ? d.Room.RoomNumber : null,
                    floor = d.Room != null ? d.Room.Floor : null,
                    roomTypeName = d.RoomType != null ? d.RoomType.Name : (d.Room != null && d.Room.RoomType != null ? d.Room.RoomType.Name : null),
                    capacityAdults = d.RoomType != null ? d.RoomType.CapacityAdults : (d.Room != null && d.Room.RoomType != null ? d.Room.RoomType.CapacityAdults : 0),
                    nights = (int)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays),
                    subtotal = d.PricePerNight * (decimal)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays)
                }).ToList()
            };

            return Ok(result);
        }

        // PUT: api/Bookings/5 - Chỉ cập nhật thông tin header Booking
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBooking(int id, Booking booking)
        {
            if (id != booking.Id) return BadRequest();

            var existing = await _context.Bookings.FindAsync(id);
            if (existing == null) return NotFound();

            existing.GuestName = booking.GuestName;
            existing.GuestPhone = booking.GuestPhone;
            existing.GuestEmail = booking.GuestEmail;
            existing.Status = booking.Status;
            existing.VoucherId = booking.VoucherId;
            existing.BookingCode = booking.BookingCode;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công!" });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] string status)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            booking.Status = status;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // POST: api/Bookings - Tạo booking kèm danh sách phòng
        [HttpPost]
        public async Task<ActionResult<object>> PostBooking([FromBody] BookingCreateRequest request)
        {
            var booking = new Booking
            {
                BookingCode = request.BookingCode,
                GuestName = request.GuestName,
                GuestPhone = request.GuestPhone,
                GuestEmail = request.GuestEmail,
                Status = request.Status ?? "Pending",
                VoucherId = request.VoucherId,
                UserId = request.UserId
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Thêm BookingDetails
            if (request.BookingDetails != null && request.BookingDetails.Count > 0)
            {
                foreach (var detail in request.BookingDetails)
                {
                    var bookingDetail = new BookingDetail
                    {
                        BookingId = booking.Id,
                        RoomId = detail.RoomId,
                        RoomTypeId = detail.RoomTypeId,
                        CheckInDate = detail.CheckInDate,
                        CheckOutDate = detail.CheckOutDate,
                        PricePerNight = detail.PricePerNight
                    };
                    _context.BookingDetails.Add(bookingDetail);
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction("GetBooking", new { id = booking.Id }, new { id = booking.Id, bookingCode = booking.BookingCode });
        }

        // PUT: api/Bookings/5/details - Cập nhật BookingDetails
        [HttpPut("{id}/details")]
        public async Task<IActionResult> UpdateBookingDetails(int id, [FromBody] List<BookingDetailRequest> details)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            // Xóa tất cả details cũ
            var oldDetails = _context.BookingDetails.Where(d => d.BookingId == id);
            _context.BookingDetails.RemoveRange(oldDetails);

            // Thêm details mới
            foreach (var detail in details)
            {
                var bookingDetail = new BookingDetail
                {
                    BookingId = id,
                    RoomId = detail.RoomId,
                    RoomTypeId = detail.RoomTypeId,
                    CheckInDate = detail.CheckInDate,
                    CheckOutDate = detail.CheckOutDate,
                    PricePerNight = detail.PricePerNight
                };
                _context.BookingDetails.Add(bookingDetail);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật chi tiết phòng thành công!" });
        }

        // DELETE: api/Bookings/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            // Xóa kèm BookingDetails
            var details = _context.BookingDetails.Where(d => d.BookingId == id);
            _context.BookingDetails.RemoveRange(details);
            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookingExists(int id)
        {
            return _context.Bookings.Any(e => e.Id == id);
        }
    }

    // DTO classes
    public class BookingCreateRequest
    {
        public string BookingCode { get; set; } = null!;
        public string? GuestName { get; set; }
        public string? GuestPhone { get; set; }
        public string? GuestEmail { get; set; }
        public string? Status { get; set; }
        public int? VoucherId { get; set; }
        public int? UserId { get; set; }
        public List<BookingDetailRequest>? BookingDetails { get; set; }
    }

    public class BookingDetailRequest
    {
        public int? RoomId { get; set; }
        public int? RoomTypeId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal PricePerNight { get; set; }
    }
}
