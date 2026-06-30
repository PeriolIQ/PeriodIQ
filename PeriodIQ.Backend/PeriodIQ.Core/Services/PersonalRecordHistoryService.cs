using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class PersonalRecordHistoryService
{
    private readonly IPersonalRecordHistoryRepository _repository;

    public PersonalRecordHistoryService(IPersonalRecordHistoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<PersonalRecordHistory>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<PersonalRecordHistory> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(PersonalRecordHistory entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(PersonalRecordHistory entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
