using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class WorkoutSessionLogService
{
    private readonly IWorkoutSessionLogRepository _repository;

    public WorkoutSessionLogService(IWorkoutSessionLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<WorkoutSessionLog>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<WorkoutSessionLog> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(WorkoutSessionLog entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(WorkoutSessionLog entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
