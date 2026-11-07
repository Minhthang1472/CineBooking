using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Controllers
{
    public class ImageUrlDto {
        public string ImageUrl { get; set; } = null!;
    }

    [Route("api/[controller]")]
    [ApiController]
    public class RoomTypesController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IWebHostEnvironment _env;

        // IWebHostEnvironment giúp chúng ta lấy được đường dẫn vật lý của thư mục project để lưu file
        public RoomTypesController(HotelDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/RoomTypes
        [HttpGet]
        public async Task<IActionResult> GetRoomTypes()
        {
           // Trả về danh sách loại phòng KÈM THEO danh sách ảnh
            var roomTypes = await _context.RoomTypes
                .Include(rt => rt.RoomImages)
                .ToListAsync();

            // QUAN TRỌNG: Gói mảng dữ liệu vào một Object có key là "data"
            return Ok(new { data = roomTypes });
        }

        // POST: api/RoomTypes/{id}/images
        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Vui lòng chọn một file ảnh." });

            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
                return NotFound(new { Message = "Không tìm thấy loại phòng này." });

            // 1. Tạo thư mục wwwroot/uploads nếu chưa tồn tại
            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, "uploads");
            
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // 2. Tạo tên file ngẫu nhiên để không bị trùng (vd: abc-123_anh1.jpg)
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // 3. Copy file người dùng gửi lên vào thư mục vật lý
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // 4. Lưu thông tin (đường dẫn ảnh) vào Database
            var roomImage = new RoomImage
            {
                RoomTypeId = id,
                ImageUrl = "/uploads/" + uniqueFileName,
                IsPrimary = false // Mặc định ảnh mới up không phải là ảnh bìa chính
            };

            _context.RoomImages.Add(roomImage);
            await _context.SaveChangesAsync();

            return Ok(new {
                Message = "Upload ảnh thành công!", 
                ImageUrl = roomImage.ImageUrl 
            });
        }

        // POST: api/RoomTypes/{id}/images/url
        [HttpPost("{id}/images/url")]
        public async Task<IActionResult> AddImageUrl(int id, [FromBody] ImageUrlDto dto)
        {
            if (string.IsNullOrEmpty(dto.ImageUrl))
                return BadRequest(new { Message = "URL ảnh không được để trống." });

            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
                return NotFound(new { Message = "Không tìm thấy loại phòng này." });

            var roomImage = new RoomImage
            {
                RoomTypeId = id,
                ImageUrl = dto.ImageUrl,
                IsPrimary = false 
            };

            _context.RoomImages.Add(roomImage);
            await _context.SaveChangesAsync();

            return Ok(new {
                Message = "Thêm ảnh từ URL thành công!", 
                ImageUrl = roomImage.ImageUrl 
            });
        }
    
        // DELETE: api/RoomTypes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
            {
                return NotFound(new { Message = "Không tìm thấy loại phòng này." });
            }

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa loại phòng thành công." });
        }

        // DELETE: api/RoomTypes/images/{imageId}
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var roomImage = await _context.RoomImages.FindAsync(imageId);
            if (roomImage == null)
            {
                return NotFound(new { Message = "Không tìm thấy ảnh này." });
            }

            // Xóa luôn file vật lý lưu trong thư mục wwwroot để đỡ tốn dung lượng ổ cứng
            // Nhưng chỉ thực hiện nếu nó không phải là đường dẫn URL (Cloudinary)
            if (!roomImage.ImageUrl.StartsWith("http"))
            {
                var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                // Xóa dấu '/' ở đầu chuỗi (nếu có) để nối path không bị lỗi
                var filePath = Path.Combine(webRootPath, roomImage.ImageUrl.TrimStart('/')); 
                
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            _context.RoomImages.Remove(roomImage);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa ảnh thành công." });
        }

        // PATCH: api/RoomTypes/{roomTypeId}/images/{imageId}/set-primary
        [HttpPatch("{roomTypeId}/images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimaryImage(int roomTypeId, int imageId)
        {
            // Lấy loại phòng kèm theo toàn bộ ảnh của nó
            var roomType = await _context.RoomTypes
                .Include(rt => rt.RoomImages)
                .FirstOrDefaultAsync(rt => rt.Id == roomTypeId);

            if (roomType == null) return NotFound(new { Message = "Không tìm thấy loại phòng." });

            var imageToSet = roomType.RoomImages.FirstOrDefault(img => img.Id == imageId);
            if (imageToSet == null) return NotFound(new { Message = "Không tìm thấy ảnh này trong loại phòng." });

            // Đặt thuộc tính IsPrimary của tất cả các ảnh khác về false
            foreach (var img in roomType.RoomImages)
            {
                img.IsPrimary = false;
            }
            
            // Chỉ đặt ảnh được chọn thành true
            imageToSet.IsPrimary = true;

            await _context.SaveChangesAsync();
return Ok(new { Message = "Đã cập nhật ảnh đại diện thành công." });
        }
    }
}