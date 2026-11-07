using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc phải có Token (đăng nhập) mới được gọi API này
    public class AmenitiesController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public AmenitiesController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Amenities
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Amenity>>> GetAmenities()
        {
            return await _context.Amenities.ToListAsync();
        }

        // POST: api/Amenities
        [HttpPost]
        public async Task<ActionResult<Amenity>> CreateAmenity(Amenity amenity)
        {
            _context.Amenities.Add(amenity);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Thêm tiện ích thành công", Data = amenity });
        }

        // PUT: api/Amenities/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAmenity(int id, Amenity amenity)
        {
            if (id != amenity.Id)
            {
                return BadRequest(new { Message = "ID không khớp." });
            }

            _context.Entry(amenity).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AmenityExists(id)) return NotFound();
                else throw;
            }

            return Ok(new { Message = "Cập nhật tiện ích thành công" });
        }

        // DELETE: api/Amenities/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAmenity(int id)
        {
            var amenity = await _context.Amenities.FindAsync(id);
            if (amenity == null) return NotFound();

            _context.Amenities.Remove(amenity);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa tiện ích." });
        }

        private bool AmenityExists(int id)
        {
            return _context.Amenities.Any(e => e.Id == id);
        }
    }
}