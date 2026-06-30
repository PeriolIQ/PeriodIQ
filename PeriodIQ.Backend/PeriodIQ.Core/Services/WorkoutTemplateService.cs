using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

public class WorkoutTemplateService
{
    private readonly IWorkoutTemplateRepository _repository;

    public WorkoutTemplateService(IWorkoutTemplateRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<WorkoutTemplate>> GetAllAsync() => await _repository.GetAllAsync();
    public async Task<WorkoutTemplate> GetByIdAsync(string id) => await _repository.GetByIdAsync(id);
    public async Task AddAsync(WorkoutTemplate entity) => await _repository.AddAsync(entity);
    public async Task UpdateAsync(WorkoutTemplate entity) => await _repository.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _repository.DeleteAsync(id);
}
