using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class DailyCnsStatusService
{
    private readonly IDailyCnsStatusRepository _repository;

    public DailyCnsStatusService(IDailyCnsStatusRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<DailyCnsStatus>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<DailyCnsStatus> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(DailyCnsStatus entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(DailyCnsStatus entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
