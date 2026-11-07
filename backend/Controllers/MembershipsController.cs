using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembershipsController : ControllerBase
    {
        private readonly HotelDbContext _context;
        public MembershipsController(HotelDbContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetMemberships()
        {
            var result = await _context.Memberships
                .Select(m => new {
                    m.Id,
                    m.TierName,
                    m.MinPoints,
                    m.DiscountPercent,
                    memberCount = m.Users.Count
                })
                .ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Membership>> GetMembership(int id)
        {
            var m = await _context.Memberships.FindAsync(id);
            if (m == null) return NotFound();
            return m;
        }

        [HttpPost]
        public async Task<ActionResult<Membership>> PostMembership(Membership membership)
        {
            _context.Memberships.Add(membership);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMembership), new { id = membership.Id }, membership);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMembership(int id, Membership membership)
        {
            if (id != membership.Id) return BadRequest();
            _context.Entry(membership).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!_context.Memberships.Any(e => e.Id == id)) return NotFound(); else throw; }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMembership(int id)
        {
            var m = await _context.Memberships.FindAsync(id);
            if (m == null) return NotFound();
            _context.Memberships.Remove(m);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
