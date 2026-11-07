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
    public class ReviewsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public ReviewsController(HotelDbContext context)
        {
            _context = context;
        }

        // GET: api/Reviews — chỉ trả về đánh giá đã được duyệt (public website)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews()
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.RoomType)
                .Where(r => r.IsApproved)
                .OrderByDescending(r => r.Id)
                .ToListAsync();
        }

        // GET: api/Reviews/all — trả về tất cả (dành cho admin)
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<Review>>> GetAllReviews()
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.RoomType)
                .OrderByDescending(r => r.Id)
                .ToListAsync();
        }

        // GET: api/Reviews/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Review>> GetReview(int id)
        {
            var review = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
            {
                return NotFound();
            }

            return review;
        }

        // PATCH: api/Reviews/5/approve — duyệt đánh giá (admin)
        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> ApproveReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound();

            review.IsApproved = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đánh giá đã được duyệt!", id });
        }

        // PATCH: api/Reviews/5/reject — hủy duyệt (admin)
        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> RejectReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound();

            review.IsApproved = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã hủy duyệt đánh giá!", id });
        }

        // PUT: api/Reviews/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReview(int id, Review review)
        {
            if (id != review.Id)
            {
                return BadRequest();
            }

            _context.Entry(review).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReviewExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Reviews — review từ website, mặc định chưa duyệt
        [HttpPost]
        public async Task<ActionResult<Review>> PostReview(Review review)
        {
            review.CreatedAt = DateTime.UtcNow;
            review.IsApproved = false; // Cần admin duyệt
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetReview", new { id = review.Id }, review);
        }

        // DELETE: api/Reviews/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ReviewExists(int id)
        {
            return _context.Reviews.Any(e => e.Id == id);
        }
    }
}
