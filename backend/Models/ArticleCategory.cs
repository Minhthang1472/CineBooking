using System;
using System.Collections.Generic;

namespace HotelManagementApi.Models;

public partial class ArticleCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Article> Articles { get; set; } = new List<Article>();
}
