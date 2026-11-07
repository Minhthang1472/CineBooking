using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderServicesController : ControllerBase
    {
        private readonly HotelDbContext _context;
        public OrderServicesController(HotelDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrderServices()
        {
            var result = await _context.OrderServices
                .Include(o => o.BookingDetail)
                    .ThenInclude(bd => bd.Booking)
                .Include(o => o.OrderServiceDetails)
                    .ThenInclude(d => d.Service)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new {
                    o.Id,
                    o.BookingDetailId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    bookingCode = o.BookingDetail != null && o.BookingDetail.Booking != null
                        ? o.BookingDetail.Booking.BookingCode : null,
                    guestName = o.BookingDetail != null && o.BookingDetail.Booking != null
                        ? o.BookingDetail.Booking.GuestName : null,
                    items = o.OrderServiceDetails.Select(d => new {
                        d.Id,
                        d.Quantity,
                        d.UnitPrice,
                        serviceName = d.Service != null ? d.Service.Name : null
                    })
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderService>> GetOrderService(int id)
        {
            var o = await _context.OrderServices
                .Include(x => x.OrderServiceDetails).ThenInclude(d => d.Service)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (o == null) return NotFound();
            return o;
        }

        [HttpPost]
        public async Task<ActionResult<OrderService>> PostOrderService(OrderService order)
        {
            if (order.OrderDate == null) order.OrderDate = DateTime.Now;
            if (order.Status == null) order.Status = "Pending";
            _context.OrderServices.Add(order);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOrderService), new { id = order.Id }, order);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrderService(int id, OrderService order)
        {
            if (id != order.Id) return BadRequest();
            _context.Entry(order).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!_context.OrderServices.Any(e => e.Id == id)) return NotFound(); else throw; }
            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var order = await _context.OrderServices.FindAsync(id);
            if (order == null) return NotFound();
            order.Status = status;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật trạng thái thành công", Status = status });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderService(int id)
        {
            var o = await _context.OrderServices.FindAsync(id);
            if (o == null) return NotFound();
            _context.OrderServices.Remove(o);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
