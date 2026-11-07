using System;
using System.Collections.Generic;

namespace HotelManagementApi.Models;

public partial class Attraction
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal? DistanceKm { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public string? MapEmbedLink { get; set; }

    public string? Category { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }
}
