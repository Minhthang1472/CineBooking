using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly HotelDbContext _context;
        public InvoicesController(HotelDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoices()
        {
            var result = await _context.Invoices
                .Include(i => i.Booking)
                .Include(i => i.Payments)
                .OrderByDescending(i => i.Id)
                .Select(i => new {
                    i.Id,
                    i.BookingId,
                    bookingCode = i.Booking != null ? i.Booking.BookingCode : null,
                    guestName   = i.Booking != null ? i.Booking.GuestName : null,
                    i.TotalRoomAmount,
                    i.TotalServiceAmount,
                    i.DiscountAmount,
                    i.TaxAmount,
                    i.FinalTotal,
                    i.Status,
                    paymentCount = i.Payments.Count
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices.Include(i => i.Payments).FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) return NotFound();
            return invoice;
        }

        [HttpPost]
        public async Task<ActionResult<Invoice>> PostInvoice(Invoice invoice)
        {
            // Tự động lấy thông tin từ Booking nếu có bookingId
            if (invoice.BookingId > 0)
            {
                var booking = await _context.Bookings
                    .Include(b => b.BookingDetails)
                    .FirstOrDefaultAsync(b => b.Id == invoice.BookingId);

                if (booking == null)
                    return BadRequest(new { message = $"Không tìm thấy booking ID={invoice.BookingId}" });

                // Auto-fill từ booking nếu chưa có
                if (string.IsNullOrEmpty(invoice.Status)) invoice.Status = "Unpaid";

                // Tính totalRoomAmount từ BookingDetails nếu chưa nhập
                if (invoice.TotalRoomAmount == 0 && booking.BookingDetails?.Any() == true)
                {
                    invoice.TotalRoomAmount = booking.BookingDetails.Sum(d =>
                        d.PricePerNight * (decimal)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalDays));
                }

                // Tính thuế VAT 10% nếu chưa nhập
                if (invoice.TaxAmount == 0)
                    invoice.TaxAmount = Math.Round(((invoice.TotalRoomAmount ?? 0m) + (invoice.TotalServiceAmount ?? 0m) - (invoice.DiscountAmount ?? 0m)) * 0.1m, 0);

                // Tính FinalTotal nếu chưa nhập
                if (invoice.FinalTotal == 0)
                    invoice.FinalTotal = (invoice.TotalRoomAmount ?? 0m) + (invoice.TotalServiceAmount ?? 0m)
                        - (invoice.DiscountAmount ?? 0m) + (invoice.TaxAmount ?? 0m);

            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Trả về với đầy đủ thông tin booking
            var result = await _context.Invoices
                .Include(i => i.Booking)
                .Where(i => i.Id == invoice.Id)
                .Select(i => new {
                    i.Id, i.BookingId,
                    bookingCode = i.Booking != null ? i.Booking.BookingCode : null,
                    guestName   = i.Booking != null ? i.Booking.GuestName : null,
                    i.TotalRoomAmount, i.TotalServiceAmount, i.DiscountAmount, i.TaxAmount, i.FinalTotal, i.Status
                }).FirstOrDefaultAsync();

            return Ok(result);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> PutInvoice(int id, Invoice invoice)
        {
            if (id != invoice.Id) return BadRequest();
            _context.Entry(invoice).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!_context.Invoices.Any(e => e.Id == id)) return NotFound(); else throw; }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();
            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
