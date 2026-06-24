using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Infrastructure.Data;

/// <summary>
/// Repository chung dùng chung cho mọi thực thể.
/// Lưu ý: Tạm thời implement cơ bản dùng DynamoDBContext. User sẽ cấu hình kết nối thật sau.
/// </summary>
public class DynamoDbRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    private readonly IDynamoDBContext _context;

    public DynamoDbRepository(IDynamoDBContext context)
    {
        _context = context;
    }

    public async Task<T> GetByIdAsync(string id)
    {
        return await _context.LoadAsync<T>(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        // DynamoDB Scan (chỉ dùng cho bảng nhỏ, thực tế nên dùng Query với GSI)
        var search = _context.ScanAsync<T>(new List<ScanCondition>());
        return await search.GetRemainingAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _context.SaveAsync(entity);
    }

    public async Task UpdateAsync(T entity)
    {
        await _context.SaveAsync(entity); // DynamoDB Save thay thế luôn bản ghi cũ
    }

    public async Task DeleteAsync(string id)
    {
        await _context.DeleteAsync<T>(id);
    }
}
