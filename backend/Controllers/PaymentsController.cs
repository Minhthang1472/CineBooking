using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly HotelDbContext _context;
        public PaymentsController(HotelDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPayments()
        {
            var result = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new {
                    p.Id,
                    p.InvoiceId,
                    p.PaymentMethod,
                    p.AmountPaid,
                    p.TransactionCode,
                    p.PaymentDate,
                    invoiceStatus = p.Invoice != null ? p.Invoice.Status : null,
                    bookingCode   = p.Invoice != null && p.Invoice.Booking != null ? p.Invoice.Booking.BookingCode : null,
                    guestName     = p.Invoice != null && p.Invoice.Booking != null ? p.Invoice.Booking.GuestName : null,
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var p = await _context.Payments.FindAsync(id);
            if (p == null) return NotFound();
            return p;
        }

        [HttpPost]
        public async Task<ActionResult<Payment>> PostPayment(Payment payment)
        {
            if (payment.PaymentDate == null) payment.PaymentDate = DateTime.Now;
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Cập nhật trạng thái Invoice thành Paid nếu đủ tiền
            if (payment.InvoiceId != null)
            {
                var invoice = await _context.Invoices.FindAsync(payment.InvoiceId);
                if (invoice != null)
                {
                    var totalPaid = _context.Payments.Where(p => p.InvoiceId == payment.InvoiceId).Sum(p => p.AmountPaid);
                    if (totalPaid >= (invoice.FinalTotal ?? 0))
                    {
                        invoice.Status = "Paid";
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var p = await _context.Payments.FindAsync(id);
            if (p == null) return NotFound();
            _context.Payments.Remove(p);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
