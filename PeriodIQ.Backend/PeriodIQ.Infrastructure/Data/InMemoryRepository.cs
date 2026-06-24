using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Infrastructure.Data;

/// <summary>
/// MOCK REPOSITORY (Dùng để Test khi chưa nối DB thật)
/// Lưu toàn bộ dữ liệu trên thanh RAM bằng ConcurrentDictionary (An toàn khi chạy đa luồng).
/// </summary>
public class InMemoryRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    // Dữ liệu được lưu tại đây. Vì là static, nó sẽ tồn tại miễn là ứng dụng (API) còn đang chạy.
    private static readonly ConcurrentDictionary<string, T> _store = new();

    public Task<T> GetByIdAsync(string id)
    {
        _store.TryGetValue(id, out var entity);
        return Task.FromResult(entity);
    }

    public Task<IEnumerable<T>> GetAllAsync()
    {
        return Task.FromResult(_store.Values.AsEnumerable());
    }

    public Task AddAsync(T entity)
    {
        if (string.IsNullOrEmpty(entity.Id))
        {
            entity.Id = Guid.NewGuid().ToString(); // Tự động sinh ID nếu chưa có
        }
        _store.TryAdd(entity.Id, entity);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(T entity)
    {
        if (_store.ContainsKey(entity.Id))
        {
            _store[entity.Id] = entity;
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id)
    {
        _store.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}
